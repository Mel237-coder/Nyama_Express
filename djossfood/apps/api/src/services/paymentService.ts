import crypto from 'crypto';
import axios from 'axios';
import { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseAdmin } from '../config/supabase';
import { CAMEROON_PHONE_REGEX } from '../config/constants';

export interface PaymentParams {
  phoneNumber: string;
  amount: number;
  description: string;
  externalReference: string;
  provider?: 'orange_money' | 'mtn_momo';
}

export interface PaymentResult {
  success: boolean;
  reference?: string;
  message: string;
}

export interface WebhookResult {
  success: boolean;
  message: string;
}

export class PaymentService {
  private baseUrl: string;
  private token: string | null = null;
  private tokenExpiry: number = 0;
  private supabaseOverride: SupabaseClient | null = null;

  constructor() {
    this.baseUrl = process.env.CAMPAY_BASE_URL || 'https://demo.campay.net/api';
  }

  /** Inject a mock Supabase client for testing */
  setSupabaseMock(client: SupabaseClient): void {
    this.supabaseOverride = client;
  }

  private get supabase(): SupabaseClient {
    return this.supabaseOverride || getSupabaseAdmin();
  }

  /**
   * Authenticate with Campay API and cache the token.
   * Tokens are cached for 50 minutes (Campay tokens expire in 1 hour).
   */
  private async getToken(): Promise<string> {
    if (this.token && Date.now() < this.tokenExpiry) {
      return this.token;
    }

    const username = process.env.CAMPAY_USERNAME;
    const password = process.env.CAMPAY_PASSWORD;

    if (!username || !password) {
      throw new Error('CAMPAY_USERNAME and CAMPAY_PASSWORD are required');
    }

    const response = await axios.post(`${this.baseUrl}/token/`, {
      username,
      password,
    });

    this.token = response.data.token;
    // Cache for 50 minutes (tokens expire in 60 minutes)
    this.tokenExpiry = Date.now() + 50 * 60 * 1000;

    return this.token!;
  }

  /**
   * Validate phone number format.
   * Must match Cameroon format: +2376XXXXXXXX
   */
  private validatePhone(phone: string): boolean {
    return CAMEROON_PHONE_REGEX.test(phone);
  }

  /**
   * Validate amount is a positive integer (FCFA).
   */
  private validateAmount(amount: number): boolean {
    return Number.isInteger(amount) && amount > 0;
  }

  /**
   * Initiate a mobile money payment via Campay's collect endpoint.
   * Strips the + prefix from the phone number as Campay expects 237XXXXXXXXX.
   */
  async initiatePayment(params: PaymentParams): Promise<PaymentResult> {
    // Validate phone number
    if (!this.validatePhone(params.phoneNumber)) {
      return {
        success: false,
        message: 'Invalid phone number format. Expected +2376XXXXXXXX',
      };
    }

    // Validate amount
    if (!this.validateAmount(params.amount)) {
      return {
        success: false,
        message: 'Invalid amount. Must be a positive integer (FCFA)',
      };
    }

    try {
      const token = await this.getToken();

      // Strip + from phone number for Campay (expects 237XXXXXXXXX)
      const from = params.phoneNumber.replace(/^\+/, '');

      const response = await axios.post(
        `${this.baseUrl}/collect/`,
        {
          amount: params.amount,
          currency: 'XAF',
          from,
          description: params.description,
          external_reference: params.externalReference,
        },
        {
          headers: {
            Authorization: `Token ${token}`,
            'Content-Type': 'application/json',
          },
        },
      );

      const reference = response.data.reference || '';
      const status = response.data.status || 'PENDING';

      // Log transaction to database
      try {
        await this.supabase.from('payment_transactions').insert({
          reference,
          external_reference: params.externalReference,
          phone_number: params.phoneNumber,
          amount: params.amount,
          currency: 'XAF',
          status: status.toLowerCase(),
          provider: params.provider || 'unknown',
        });
      } catch (dbError: any) {
        // Log but don't fail the payment if DB insert fails
        console.error('Failed to log payment transaction:', dbError.message);
      }

      return {
        success: true,
        reference,
        message: `Payment initiated with status: ${status}`,
      };
    } catch (error: any) {
      const message =
        error.response?.data?.detail || error.message || 'Payment initiation failed';
      return {
        success: false,
        message: `Payment error: ${message}`,
      };
    }
  }

  /**
   * Verify webhook signature using HMAC-SHA256.
   * Compares in constant-time to prevent timing attacks.
   */
  private verifyWebhookSignature(rawBody: string, signature: string | undefined): boolean {
    if (!signature) {
      return false;
    }

    const secret = process.env.CAMPAY_WEBHOOK_SECRET;
    if (!secret) {
      console.error('CAMPAY_WEBHOOK_SECRET is not configured');
      return false;
    }

    const expected = crypto
      .createHmac('sha256', secret)
      .update(rawBody)
      .digest('hex');

    if (expected.length !== signature.length) {
      return false;
    }

    return crypto.timingSafeEqual(
      Buffer.from(expected, 'utf8'),
      Buffer.from(signature, 'utf8'),
    );
  }

  /**
   * Handle incoming webhook from Campay for payment status updates.
   * Verifies the webhook payload, finds the corresponding transaction,
   * updates the transaction status, and updates the order's payment_status.
   */
  async handlePaymentWebhook(payload: any, signature?: string): Promise<WebhookResult> {
    const rawBody = JSON.stringify(payload);
    if (!this.verifyWebhookSignature(rawBody, signature)) {
      return { success: false, message: 'Invalid webhook signature' };
    }

    const externalReference = payload.external_reference;
    const status = payload.status;
    const reference = payload.reference;

    if (!externalReference) {
      return { success: false, message: 'Missing external_reference' };
    }

    try {
      // Find the transaction by external_reference
      const { data: transaction, error: txError } = await this.supabase
        .from('payment_transactions')
        .select('*')
        .eq('external_reference', externalReference)
        .single();

      if (txError || !transaction) {
        return {
          success: false,
          message: `Transaction not found for reference: ${externalReference}`,
        };
      }

      // Update transaction status
      const newTxStatus = status === 'SUCCESSFUL' ? 'successful' : 'failed';
      await this.supabase
        .from('payment_transactions')
        .update({
          status: newTxStatus,
          campay_reference: reference,
          updated_at: new Date().toISOString(),
        })
        .eq('id', transaction.id);

      // Update order payment_status
      if (transaction.order_id) {
        const newPaymentStatus =
          status === 'SUCCESSFUL'
            ? transaction.type === 'delivery'
              ? 'completed'
              : 'partial'
            : 'failed';
        await this.supabase
          .from('orders')
          .update({ payment_status: newPaymentStatus })
          .eq('id', transaction.order_id);
      }

      return {
        success: true,
        message: `Webhook processed: transaction ${transaction.id} marked as ${newTxStatus}`,
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Webhook processing error: ${error.message}`,
      };
    }
  }

  /**
   * Refund a completed payment via Campay's refund endpoint.
   * @param reference — the Campay transaction reference string (e.g. 'CPY-12345')
   */
  async refundPayment(reference: string): Promise<boolean> {
    try {
      const { data: transaction, error: txError } = await this.supabase
        .from('payment_transactions')
        .select('*')
        .eq('reference', reference)
        .single();

      if (txError || !transaction) {
        console.error('Transaction not found for refund reference:', reference);
        return false;
      }

      const token = await this.getToken();
      const from = transaction.phone_number.replace(/^\+/, '');
      const response = await axios.post(
        `${this.baseUrl}/refund/`,
        {
          amount: transaction.amount,
          currency: 'XAF',
          from,
          reference: transaction.reference,
        },
        {
          headers: {
            Authorization: `Token ${token}`,
            'Content-Type': 'application/json',
          },
        },
      );

      if (response.data && response.data.status === 'REFUNDED') {
        await this.supabase
          .from('payment_transactions')
          .update({ status: 'refunded', updated_at: new Date().toISOString() })
          .eq('id', transaction.id);
        return true;
      }

      await this.supabase
        .from('payment_transactions')
        .update({ status: 'failed', updated_at: new Date().toISOString() })
        .eq('id', transaction.id);
      return false;
    } catch (error: any) {
      console.error('Refund failed:', error.message);
      return false;
    }
  }
}

// Export a singleton instance
export const paymentService = new PaymentService();