// ============================================
// Service de paiement - Orchestrateur principal
// Gère MTN MoMo, Orange Money et NotchPay
// ============================================

import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MtnMomoService } from './mtn-momo.service';
import { NotchpayService } from './notchpay.service';
import { AfricaTalkingService } from '../common/sms/africa-talking.service';

interface InitiatePaymentParams {
  orderId: string;
  amount: number;
  paymentMethod: 'MTN_MOMO' | 'ORANGE_MONEY' | 'CASH' | 'NOTCHPAY';
  phone?: string;
  email?: string;
}

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private prisma: PrismaService,
    private mtnMomo: MtnMomoService,
    private notchpay: NotchpayService,
    private sms: AfricaTalkingService,
  ) {}

  // ============================================
  // INITIATION PAIEMENT
  // ============================================

  /**
   * Initie un paiement selon la méthode choisie
   */
  async initiatePayment(params: InitiatePaymentParams): Promise<{
    success: boolean;
    paymentId?: string;
    message?: string;
    error?: string;
  }> {
    const { orderId, amount, paymentMethod, phone, email } = params;

    // Vérifier que la commande existe
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { client: true },
    });

    if (!order) {
      throw new NotFoundException('Commande non trouvée');
    }

    // Vérifier que le montant correspond
    if (order.total !== amount) {
      throw new BadRequestException('Le montant ne correspond pas à la commande');
    }

    // Paiement en cash - pas d'initiation nécessaire
    if (paymentMethod === 'CASH') {
      await this.prisma.payment.create({
        data: {
          orderId,
          provider: 'cash',
          amount,
          currency: 'XAF',
          status: 'PENDING', // Sera confirmé à la livraison
        },
      });

      return {
        success: true,
        message: 'Paiement à la livraison sélectionné',
      };
    }

    // Numéro de téléphone pour Mobile Money
    const payerPhone = (phone || order.client.phone) ?? undefined;

    // Route vers le provider approprié
    switch (paymentMethod) {
      case 'MTN_MOMO':
        if (!payerPhone) {
          return { success: false, error: 'Numéro de téléphone requis pour MTN MoMo' };
        }
        return this.initiateMtnPayment(orderId, amount, payerPhone);

      case 'ORANGE_MONEY':
        // Orange Money - même logique que MTN pour l'instant
        if (!payerPhone) {
          return { success: false, error: 'Numéro de téléphone requis pour Orange Money' };
        }
        return this.initiateMtnPayment(orderId, amount, payerPhone);

      case 'NOTCHPAY':
        return this.initiateNotchpayPayment(orderId, amount, payerPhone, email);

      default:
        return {
          success: false,
          error: 'Moyen de paiement non supporté',
        };
    }
  }

  private async initiateMtnPayment(
    orderId: string,
    amount: number,
    phone: string,
  ): Promise<{ success: boolean; paymentId?: string; message?: string; error?: string }> {
    const result = await this.mtnMomo.requestPayment({
      orderId,
      amount,
      phone,
    });

    if (result.success) {
      // Envoyer SMS pour informer le client
      await this.sms.sendSms({
        to: phone,
        message: `FoodApp: Veuillez confirmer le paiement de ${amount} FCFA sur votre téléphone MTN. Code: ${orderId.slice(0, 8)}`,
      });

      return {
        success: true,
        paymentId: result.internalPaymentId,
        message: 'Demande de paiement envoyée. Veuillez confirmer sur votre téléphone.',
      };
    }

    return {
      success: false,
      error: result.error || 'Erreur lors de l\'initiation du paiement',
    };
  }

  private async initiateNotchpayPayment(
    orderId: string,
    amount: number,
    phone?: string,
    email?: string,
  ): Promise<{ success: boolean; paymentId?: string; message?: string; error?: string }> {
    const result = await this.notchpay.initializePayment({
      orderId,
      amount,
      phone,
      email,
      paymentMethod: 'mtn', // Par défaut MTN via NotchPay
      description: `Commande FoodApp ${orderId.slice(0, 8)}`,
    });

    if (result.success) {
      // Envoyer notification
      if (phone) {
        await this.sms.sendSms({
          to: phone,
          message: `FoodApp: Paiement de ${amount} FCFA initié. Veuillez confirmer via USSD.`,
        });
      }

      return {
        success: true,
        paymentId: result.paymentId,
        message: 'Paiement initié avec succès',
      };
    }

    return {
      success: false,
      error: result.error || 'Erreur NotchPay',
    };
  }

  // ============================================
  // VÉRIFICATION STATUT
  // ============================================

  /**
   * Vérifie le statut d'un paiement
   */
  async getPaymentStatus(paymentId: string): Promise<{
    status: string;
    amount?: number;
    provider?: string;
    error?: string;
  }> {
    const payment = await this.prisma.payment.findFirst({
      where: {
        OR: [
          { id: paymentId },
          { internalPaymentId: paymentId },
          { providerTransactionId: paymentId },
        ],
      },
    });

    if (!payment) {
      throw new NotFoundException('Paiement non trouvé');
    }

    // Pour les paiements simulate, retourner directement
    if (payment.internalPaymentId?.startsWith('sim_') ||
        payment.internalPaymentId?.startsWith('notchpay_sim_')) {
      return {
        status: payment.status,
        amount: payment.amount,
        provider: payment.provider,
      };
    }

    // Vérifier selon le provider
    if (payment.provider === 'mtn_momo') {
      const mtnStatus = await this.mtnMomo.getPaymentStatus(payment.internalPaymentId!);
      return {
        status: mtnStatus.status === 'SUCCESS' ? 'SUCCESS' : mtnStatus.status,
        amount: payment.amount,
        provider: 'mtn_momo',
      };
    }

    if (payment.provider === 'notchpay') {
      const notchpayStatus = await this.notchpay.getPaymentStatus(payment.internalPaymentId!);
      return {
        status: notchpayStatus.status === 'SUCCESS' ? 'SUCCESS' : notchpayStatus.status,
        amount: payment.amount,
        provider: 'notchpay',
      };
    }

    return {
      status: payment.status,
      amount: payment.amount,
      provider: payment.provider,
    };
  }

  // ============================================
  // WEBHOOKS
  // ============================================

  /**
   * Callback MTN MoMo
   */
  async handleMtnCallback(data: any): Promise<void> {
    await this.mtnMomo.handleCallback(data);
  }

  /**
   * Callback NotchPay
   */
  async handleNotchpayCallback(data: any): Promise<void> {
    await this.notchpay.handleCallback(data);
  }

  // ============================================
  // REMBOURSEMENT
  // ============================================

  /**
   * Effectue un remboursement
   */
  async refund(orderId: string, reason: string): Promise<{
    success: boolean;
    refundId?: string;
    error?: string;
  }> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { payment: true, client: true },
    });

    if (!order) {
      throw new NotFoundException('Commande non trouvée');
    }

    if (order.paymentStatus !== 'SUCCESS') {
      throw new BadRequestException('Cette commande n\'a pas été payée');
    }

    if (!order.payment) {
      throw new BadRequestException('Informations de paiement non trouvées');
    }

    const payment = order.payment;
    let result: { success: boolean; refundId?: string; error?: string };

    // Effectuer le remboursement selon le provider
    switch (payment.provider) {
      case 'mtn_momo':
      case 'orange_money':
        result = await this.mtnMomo.refund({
          originalPaymentId: payment.internalPaymentId!,
          amount: payment.amount,
          reason,
        });
        break;

      case 'notchpay':
        result = await this.notchpay.refund({
          paymentId: payment.internalPaymentId!,
          amount: payment.amount,
          reason,
        });
        break;

      case 'cash':
        // Cash - remboursement direct via mobile money
        result = await this.mtnMomo.refund({
          originalPaymentId: payment.internalPaymentId || `cash_${payment.id}`,
          amount: payment.amount,
          reason,
        });
        break;

      default:
        return { success: false, error: 'Provider de paiement non reconnu' };
    }

    // Mettre à jour la commande
    if (result.success) {
      await this.prisma.order.update({
        where: { id: orderId },
        data: { paymentStatus: 'REFUNDED' },
      });

      // Envoyer SMS de confirmation
      if (order.client.phone) {
        await this.sms.sendSms({
          to: order.client.phone,
          message: `FoodApp: Votre remboursement de ${payment.amount} FCFA est en cours de traitement. Merci de votre patience.`,
        });
      }
    }

    return result;
  }

  // ============================================
  // HISTORIQUE PAIEMENTS
  // ============================================

  /**
   * Récupère l'historique des paiements d'un utilisateur
   */
  async getUserPaymentHistory(
    userId: string,
    page = 1,
    limit = 20,
  ): Promise<{ data: any[]; meta: any }> {
    const skip = (page - 1) * limit;

    const [payments, total] = await Promise.all([
      this.prisma.payment.findMany({
        where: {
          order: { clientId: userId },
        },
        include: {
          order: {
            select: {
              id: true,
              status: true,
              restaurant: { select: { name: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.payment.count({
        where: { order: { clientId: userId } },
      }),
    ]);

    return {
      data: payments.map((p) => ({
        id: p.id,
        amount: p.amount,
        currency: p.currency,
        status: p.status,
        provider: p.provider,
        createdAt: p.createdAt,
        order: p.order,
      })),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}