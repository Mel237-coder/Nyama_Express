// ============================================
// Service NotchPay - Agrégateur de paiement Cameroun
// Alternative à MTN/Orange Direct
// Docs: https://docs.notchpay.co
// ============================================

import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

interface NotchPayPayment {
  id?: string;
  currency?: string;
  amount?: number;
  status?: 'pending' | 'success' | 'failed' | 'refunded';
  reference?: string;
  payment_method?: string;
  customer?: {
    name?: string;
    email?: string;
    phone?: string;
  };
  metadata?: any;
}

@Injectable()
export class NotchpayService {
  private readonly logger = new Logger(NotchpayService.name);

  private readonly publicKey: string;
  private readonly callbackUrl: string;
  private readonly baseUrl = 'https://api.notchpay.co';

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    this.publicKey = this.configService.get<string>('NOTCHPAY_PUBLIC_KEY', '');
    this.callbackUrl = this.configService.get<string>('NOTCHPAY_CALLBACK_URL', '');

    if (!this.publicKey) {
      this.logger.warn('NotchPay not configured - payment will be simulated');
    }
  }

  // ============================================
  // INITIALISATION PAIEMENT
  // ============================================

  /**
   * Initie un paiement via NotchPay
   * Gère MTN, Orange, et paiement par carte
   */
  async initializePayment(params: {
    orderId: string;
    amount: number;
    phone?: string;           // Pour Mobile Money
    email?: string;           // Pour paiement carte
    paymentMethod?: 'mtn' | 'orange' | 'card';
    description?: string;
  }): Promise<{
    success: boolean;
    paymentId?: string;
    checkoutUrl?: string;
    error?: string;
  }> {
    const { orderId, amount, phone, email, paymentMethod, description } = params;

    // Mode simulation
    if (!this.publicKey) {
      this.logger.debug(`[SIMULATED NotchPay] Payment: ${amount} FCFA for order ${orderId}`);

      const payment = await this.prisma.payment.create({
        data: {
          orderId,
          provider: 'notchpay',
          amount,
          currency: 'XAF',
          status: 'PENDING',
          internalPaymentId: `notchpay_sim_${Date.now()}`,
          checkoutUrl: null,
          expiresAt: new Date(Date.now() + 90 * 1000),
        },
      });

      return {
        success: true,
        paymentId: payment.internalPaymentId!,
      };
    }

    try {
      const paymentData: Record<string, any> = {
        amount: amount,
        currency: 'XAF',
        reference: orderId,
        description: description || `Commande FoodApp ${orderId.slice(0, 8)}`,
        callback_url: this.callbackUrl,
      };

      // Ajouter le canal de paiement préféré
      if (paymentMethod === 'mtn') {
        paymentData.channel = 'MTN';
      } else if (paymentMethod === 'orange') {
        paymentData.channel = 'ORANGE';
      }

      // Numéro de téléphone pour Mobile Money
      if (phone) {
        paymentData.customer = {
          ...paymentData.customer,
          phone: this.formatPhone(phone),
        };
      }

      // Email pour paiement carte
      if (email) {
        paymentData.customer = {
          ...paymentData.customer,
          email,
        };
      }

      const response = await fetch(`${this.baseUrl}/payment/initiate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': this.publicKey,
        },
        body: JSON.stringify(paymentData),
      });

      if (!response.ok) {
        const error = await response.json();
        this.logger.error(`NotchPay init failed: ${JSON.stringify(error)}`);
        return {
          success: false,
          error: error.message || 'Erreur NotchPay',
        };
      }

      const data: NotchPayPayment = await response.json();

      // Sauvegarder en base
      const payment = await this.prisma.payment.create({
        data: {
          orderId,
          provider: 'notchpay',
          amount,
          currency: 'XAF',
          status: 'INITIATED',
          internalPaymentId: data.id,
          checkoutUrl: data.payment_method === 'ussd' ? data.id : undefined,
          expiresAt: new Date(Date.now() + 90 * 1000),
        },
      });

      return {
        success: true,
        paymentId: payment.internalPaymentId!,
      };
    } catch (error) {
      this.logger.error(`NotchPay exception: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // ============================================
  // VÉRIFICATION STATUT
  // ============================================

  /**
   * Vérifie le statut d'un paiement NotchPay
   */
  async getPaymentStatus(paymentId: string): Promise<{
    status: 'SUCCESS' | 'PENDING' | 'FAILED';
    error?: string;
  }> {
    // Mode simulation
    if (!this.publicKey || paymentId.startsWith('notchpay_sim_')) {
      return { status: 'SUCCESS' };
    }

    try {
      const response = await fetch(`${this.baseUrl}/payment/${paymentId}/status`, {
        headers: {
          'Authorization': this.publicKey,
        },
      });

      if (!response.ok) {
        return { status: 'PENDING' };
      }

      const data: NotchPayPayment = await response.json();

      const statusMap: Record<string, 'SUCCESS' | 'PENDING' | 'FAILED'> = {
        'success': 'SUCCESS',
        'pending': 'PENDING',
        'failed': 'FAILED',
        'refunded': 'FAILED',
      };

      return {
        status: statusMap[data.status || 'pending'] || 'PENDING',
      };
    } catch (error) {
      return { status: 'PENDING', error: error.message };
    }
  }

  // ============================================
  // WEBHOOK
  // ============================================

  /**
   * Traite le callback webhook de NotchPay
   */
  async handleCallback(data: {
    reference: string;       // Notre order ID
    status: string;
    transaction_id?: string;
    amount?: number;
  }): Promise<void> {
    const { reference, status, transaction_id, amount } = data;

    this.logger.log(`NotchPay callback: ${reference} -> ${status}`);

    const payment = await this.prisma.payment.findFirst({
      where: {
        OR: [
          { internalPaymentId: reference },
          { orderId: reference },
        ],
      },
      include: { order: true },
    });

    if (!payment) {
      this.logger.error(`Payment not found for NotchPay reference: ${reference}`);
      return;
    }

    const success = status === 'success';

    await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: success ? 'SUCCESS' : 'FAILED',
        providerTransactionId: transaction_id,
        processedAt: new Date(),
      },
    });

    if (payment.order) {
      await this.prisma.order.update({
        where: { id: payment.orderId },
        data: {
          paymentStatus: success ? 'SUCCESS' : 'FAILED',
        },
      });
    }

    // Logger transaction pour ANIF
    if (success && payment.order) {
      await this.prisma.transactionLog.create({
        data: {
          type: 'payment',
          userId: payment.order.clientId,
          orderId: payment.orderId,
          paymentId: payment.id,
          amount: amount || payment.amount,
          currency: 'XAF',
          provider: 'notchpay',
          providerRef: transaction_id,
          status: 'success',
          aboveThreshold: (amount || payment.amount) >= 5_000_000,
        },
      });
    }
  }

  // ============================================
  // REMBOURSEMENT
  // ============================================

  async refund(params: {
    paymentId: string;
    amount: number;
    reason: string;
  }): Promise<{ success: boolean; error?: string }> {
    const { paymentId, amount, reason } = params;

    if (!this.publicKey || paymentId.startsWith('notchpay_sim_')) {
      const payment = await this.prisma.payment.findFirst({
        where: { internalPaymentId: paymentId },
      });
      if (payment) {
        await this.prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: 'REFUNDED',
            refundReason: reason,
            refundedAt: new Date(),
          },
        });
      }
      return { success: true };
    }

    try {
      const response = await fetch(`${this.baseUrl}/payment/${paymentId}/refund`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': this.publicKey,
        },
        body: JSON.stringify({
          amount,
          reason,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        return { success: false, error: error.message };
      }

      const payment = await this.prisma.payment.findFirst({
        where: { internalPaymentId: paymentId },
      });
      if (payment) {
        await this.prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: 'REFUNDED',
            refundReason: reason,
            refundedAt: new Date(),
          },
        });
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // ============================================
  // UTILITAIRES
  // ============================================

  private formatPhone(phone: string): string {
    let cleaned = phone.replace(/[\s\-]/g, '');

    if (cleaned.startsWith('+')) {
      cleaned = cleaned.substring(1);
    } else if (cleaned.startsWith('237')) {
      cleaned = cleaned.substring(3);
    }

    return cleaned;
  }
}