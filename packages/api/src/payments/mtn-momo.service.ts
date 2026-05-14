// ============================================
// Service MTN MoMo - Intégration API Mobile Money
// Documentation: https://momopandbox docs.mtn.com
// ============================================

import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

interface PaymentRequest {
  amount: number;        // Montant en FCFA
  currency: string;      // XAF
  externalId: string;    // ID de la commande
  payer: {
    partyIdType: string; // MSISDN
    partyId: string;      // Numéro de téléphone
  };
  payerMessage: string;
  payeeNote: string;
}

interface PaymentResponse {
  status: string;
  internalPaymentId?: string;
  externalPaymentId?: string;
  errorCode?: string;
}

@Injectable()
export class MtnMomoService {
  private readonly logger = new Logger(MtnMomoService.name);

  private readonly subscriptionKey: string;
  private readonly targetEnvironment: string;
  private readonly apiUser: string;
  private readonly apiKey: string;
  private readonly callbackUrl: string;

  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    this.subscriptionKey = this.configService.get<string>('MTN_SUBSCRIPTION_KEY', '');
    this.targetEnvironment = this.configService.get<string>('MTN_TARGET_ENVIRONMENT', 'sandbox');
    this.apiUser = this.configService.get<string>('MTN_API_USER', '');
    this.apiKey = this.configService.get<string>('MTN_API_KEY', '');
    this.callbackUrl = this.configService.get<string>('MTN_CALLBACK_URL', '');

    if (!this.subscriptionKey) {
      this.logger.warn('MTN MoMo not configured - payment will be simulated');
    }
  }

  // ============================================
  // GÉNÉRATION API USER (une seule fois pourprod)
  // ============================================

  /**
   * Génère un API User pour MTN MoMo
   * À appeler une seule fois en production pour obtenir l'API User ID
   */
  async createApiUser(): Promise<{ apiUser: string }> {
    const url = `https://sandbox.momodeveloper.mtn.com/v1_0/apiuser`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Ocp-Apim-Subscription-Key': this.subscriptionKey,
        'X-Reference-Id': this.apiUser || this.generateUUID(),
      },
      body: JSON.stringify({}),
    });

    if (!response.ok) {
      const error = await response.text();
      this.logger.error(`Failed to create API user: ${error}`);
      throw new BadRequestException(`Erreur MTN MoMo: ${error}`);
    }

    return { apiUser: this.apiUser || this.generateUUID() };
  }

  /**
   * Génère une API Key pour l'API User
   */
  async createApiKey(apiUser: string): Promise<{ apiKey: string }> {
    const url = `https://sandbox.momodeveloper.mtn.com/v1_0/apiuser/${apiUser}/apikey`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': this.subscriptionKey,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      this.logger.error(`Failed to create API key: ${error}`);
      throw new BadRequestException(`Erreur MTN MoMo: ${error}`);
    }

    const data = await response.json();
    return { apiKey: data.apiKey };
  }

  // ============================================
  // AUTHENTIFICATION
  // ============================================

  /**
   * Obtient un token d'accès OAuth
   */
  async getAccessToken(): Promise<string> {
    // Vérifier si on a déjà un token valide
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    // Mode simulation si pas de config
    if (!this.subscriptionKey || !this.apiUser || !this.apiKey) {
      this.logger.debug('[SIMULATED] MTN MoMo access token');
      return 'simulated_token';
    }

    const url = `https://sandbox.momodeveloper.mtn.com/collection/token/`;

    const credentials = Buffer.from(`${this.apiUser}:${this.apiKey}`).toString('base64');

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${credentials}`,
        'Ocp-Apim-Subscription-Key': this.subscriptionKey,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      this.logger.error(`Failed to get MTN access token: ${error}`);
      throw new BadRequestException(`Erreur authentification MTN MoMo: ${error}`);
    }

    const data = await response.json();
    this.accessToken = data.access_token;
    this.tokenExpiry = Date.now() + (data.expires_in - 60) * 1000; // Expire 1 min avant

    return this.accessToken!;
  }

  // ============================================
  // DEMANDE DE PAIEMENT
  // ============================================

  /**
   * Initie une demande de paiement MTN MoMo
   * @returns ID de paiement interne pour le suivi
   */
  async requestPayment(params: {
    orderId: string;
    amount: number;
    phone: string;  // Numéro MTN du client
  }): Promise<{
    success: boolean;
    internalPaymentId?: string;
    checkoutUrl?: string;
    error?: string;
  }> {
    const { orderId, amount, phone } = params;

    // Mode simulation
    if (!this.subscriptionKey) {
      this.logger.debug(`[SIMULATED MTN] Payment request: ${amount} FCFA to ${phone}`);

      // Créer un enregistrement simulé en base
      const payment = await this.prisma.payment.create({
        data: {
          orderId,
          provider: 'mtn_momo',
          amount,
          currency: 'XAF',
          status: 'PENDING',
          internalPaymentId: `sim_${Date.now()}`,
          checkoutUrl: null,
          expiresAt: new Date(Date.now() + 90 * 1000),
        },
      });

      return {
        success: true,
        internalPaymentId: payment.internalPaymentId!,
      };
    }

    try {
      const token = await this.getAccessToken();
      const internalPaymentId = this.generateUUID();

      const url = `https://sandbox.momodeveloper.mtn.com/collection/v1_0/requesttopay`;

      const request: PaymentRequest = {
        amount,
        currency: 'XAF',
        externalId: orderId,
        payer: {
          partyIdType: 'MSISDN',
          partyId: this.formatPhoneNumber(phone),
        },
        payerMessage: `Paiement FoodApp commande ${orderId.slice(0, 8)}`,
        payeeNote: `Commande FoodApp ${amount} FCFA`,
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Reference-Id': internalPaymentId,
          'Ocp-Apim-Subscription-Key': this.subscriptionKey,
          'X-Target-Environment': this.targetEnvironment,
        },
        body: JSON.stringify(request),
      });

      if (response.status === 202 || response.status === 200) {
        // Sauvegarder en base
        const payment = await this.prisma.payment.create({
          data: {
            orderId,
            provider: 'mtn_momo',
            amount,
            currency: 'XAF',
            status: 'INITIATED',
            internalPaymentId,
            expiresAt: new Date(Date.now() + 90 * 1000), // 90 secondes
          },
        });

        // Mettre à jour la commande
        await this.prisma.order.update({
          where: { id: orderId },
          data: { paymentStatus: 'PENDING' },
        });

        return {
          success: true,
          internalPaymentId: payment.internalPaymentId!,
        };
      } else {
        const error = await response.text();
        this.logger.error(`MTN request payment failed: ${error}`);
        return {
          success: false,
          error: `Erreur MTN: ${error}`,
        };
      }
    } catch (error) {
      this.logger.error(`MTN payment request exception: ${error.message}`);
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
   * Vérifie le statut d'un paiement
   */
  async getPaymentStatus(internalPaymentId: string): Promise<{
    status: 'SUCCESS' | 'PENDING' | 'FAILED';
    externalId?: string;
    error?: string;
  }> {
    // Mode simulation
    if (!this.subscriptionKey || internalPaymentId.startsWith('sim_')) {
      // En simulation, on considère que le paiement est réussi après quelques secondes
      return { status: 'SUCCESS', externalId: `ext_${internalPaymentId}` };
    }

    try {
      const token = await this.getAccessToken();

      const url = `https://sandbox.momodeveloper.mtn.com/collection/v1_0/requesttopay/${internalPaymentId}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Ocp-Apim-Subscription-Key': this.subscriptionKey,
          'X-Target-Environment': this.targetEnvironment,
        },
      });

      if (response.status === 200) {
        const data = await response.json();

        // Mapper le statut MTN vers notre format
        const statusMap: Record<string, 'SUCCESS' | 'PENDING' | 'FAILED'> = {
          'SUCCESSFUL': 'SUCCESS',
          'PENDING': 'PENDING',
          'FAILED': 'FAILED',
          'TIMEOUT': 'FAILED',
        };

        return {
          status: statusMap[data.status] || 'PENDING',
          externalId: data.financialTransactionId,
        };
      } else {
        return { status: 'PENDING', error: 'Payment not found or pending' };
      }
    } catch (error) {
      this.logger.error(`MTN payment status check failed: ${error.message}`);
      return { status: 'PENDING', error: error.message };
    }
  }

  // ============================================
  // REMBOURSEMENT
  // ============================================

  /**
   * Effectue un remboursement MTN MoMo
   */
  async refund(params: {
    originalPaymentId: string;
    amount: number;
    reason: string;
  }): Promise<{ success: boolean; refundId?: string; error?: string }> {
    const { originalPaymentId, amount, reason } = params;

    // Mode simulation
    if (!this.subscriptionKey || originalPaymentId.startsWith('sim_')) {
      this.logger.debug(`[SIMULATED] Refund of ${amount} FCFA for payment ${originalPaymentId}`);

      const payment = await this.prisma.payment.findFirst({
        where: { internalPaymentId: originalPaymentId },
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

      return { success: true, refundId: `ref_${Date.now()}` };
    }

    try {
      const token = await this.getAccessToken();
      const refundId = this.generateUUID();

      const url = `https://sandbox.momodeveloper.mtn.com/collection/v1_0/refund`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Reference-Id': refundId,
          'Ocp-Apim-Subscription-Key': this.subscriptionKey,
          'X-Target-Environment': this.targetEnvironment,
        },
        body: JSON.stringify({
          amount: amount.toString(),
          currency: 'XAF',
          externalId: originalPaymentId,
          payerMessage: `Remboursement: ${reason}`,
          payeeNote: `FoodApp - ${reason}`,
        }),
      });

      if (response.status === 202 || response.status === 200) {
        return { success: true, refundId };
      } else {
        const error = await response.text();
        return { success: false, error };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // ============================================
  // WEBHOOK CALLBACK (appelé par MTN)
  // ============================================

  /**
   * Traite le callback webhook de MTN
   */
  async handleCallback(data: {
    referenceId: string;
    status: string;
    financialTransactionId?: string;
  }): Promise<void> {
    const { referenceId, status, financialTransactionId } = data;

    this.logger.log(`MTN callback received: ${referenceId} -> ${status}`);

    // Trouver le paiement
    const payment = await this.prisma.payment.findFirst({
      where: { internalPaymentId: referenceId },
      include: { order: true },
    });

    if (!payment) {
      this.logger.error(`Payment not found for reference: ${referenceId}`);
      return;
    }

    // Mapper le statut
    const statusMap: Record<string, 'SUCCESS' | 'FAILED'> = {
      'SUCCESSFUL': 'SUCCESS',
      'FAILED': 'FAILED',
      'TIMEOUT': 'FAILED',
    };

    const newStatus = statusMap[status] || 'FAILED';

    // Mettre à jour le paiement
    await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: newStatus === 'SUCCESS' ? 'SUCCESS' : 'FAILED',
        providerTransactionId: financialTransactionId,
        processedAt: new Date(),
      },
    });

    // Mettre à jour la commande
    await this.prisma.order.update({
      where: { id: payment.orderId },
      data: {
        paymentStatus: newStatus === 'SUCCESS' ? 'SUCCESS' : 'FAILED',
      },
    });

    // Si succès, on peut déclencher la notification au restaurant
    if (newStatus === 'SUCCESS') {
      this.logger.log(`Payment ${referenceId} successful - order ${payment.orderId} confirmed`);
      // TODO: Envoyer notification au restaurant via Socket.io
    } else {
      this.logger.warn(`Payment ${referenceId} failed`);
    }
  }

  // ============================================
  // UTILITAIRES
  // ============================================

  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  private formatPhoneNumber(phone: string): string {
    let cleaned = phone.replace(/[\s\-]/g, '');

    if (cleaned.startsWith('00')) {
      cleaned = cleaned.substring(2);
    } else if (cleaned.startsWith('+')) {
      cleaned = cleaned.substring(1);
    } else if (cleaned.startsWith('237')) {
      cleaned = cleaned.substring(3);
    }

    // MTN attend juste le numéro sans préfixe pour MSISDN
    return cleaned;
  }
}