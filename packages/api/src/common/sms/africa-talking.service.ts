// ============================================
// Service SMS via Africa's Talking
// Utilisé pour OTP et notifications
// ============================================

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface SmsOptions {
  to: string;       // Numéro avec préfixe (ex: +2376xxxxxxxx)
  message: string;
}

interface SmsResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

@Injectable()
export class AfricaTalkingService {
  private readonly logger = new Logger(AfricaTalkingService.name);
  private apiKey: string;
  private username: string;
  private from: string;

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>('AFRICASTALKING_API_KEY', '');
    this.username = this.configService.get<string>('AFRICASTALKING_USERNAME', 'sandbox');
    this.from = 'FoodApp'; // Nom d'expéditeur

    if (!this.apiKey) {
      this.logger.warn('Africa\'s Talking API key not configured - SMS disabled');
    }
  }

  /**
   * Envoie un SMS
   * @param options - Destinataire et message
   * @returns Résultat de l'envoi
   */
  async sendSms(options: SmsOptions): Promise<SmsResult> {
    const { to, message } = options;

    // Validation du numéro
    const formattedPhone = this.formatPhoneNumber(to);
    if (!formattedPhone) {
      return { success: false, error: 'Numéro de téléphone invalide' };
    }

    // Si pas de clé API, on simule l'envoi (mode développement)
    if (!this.apiKey) {
      this.logger.debug(`[SIMULATED SMS] To: ${formattedPhone}, Message: ${message}`);
      return {
        success: true,
        messageId: `sim_${Date.now()}`,
      };
    }

    try {
      // Construction de l'URL et des paramètres
      const url = `https://api.africastalking.com/version1/messaging`;
      const params = new URLSearchParams({
        username: this.username,
        to: formattedPhone,
        message: message,
        from: this.from,
      });

      const response = await fetch(`${url}?${params}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          apiKey: this.apiKey,
        },
      });

      const data = await response.json();

      if (data.status === 'Success' && data.SMSMessageData?.Recipients?.[0]?.status === 'Success') {
        return {
          success: true,
          messageId: data.SMSMessageData.Recipients[0].messageId,
        };
      } else {
        const errorMsg = data.SMSMessageData?.Recipients?.[0]?.status || 'Unknown error';
        this.logger.error(`SMS failed: ${errorMsg}`);
        return { success: false, error: errorMsg };
      }
    } catch (error) {
      this.logger.error(`SMS request failed: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Formate un numéro camerounais
   * Gère les formats: 6xxxxxxxx, +2376xxxxxxxx, 002376xxxxxxxx
   */
  private formatPhoneNumber(phone: string): string | null {
    // Nettoyage du numéro
    let cleaned = phone.replace(/[\s\-]/g, '');

    // Si commence par 00, remplacer par +
    if (cleaned.startsWith('00')) {
      cleaned = '+' + cleaned.substring(2);
    }

    // Si pas de préfixe, ajouter +237
    if (!cleaned.startsWith('+')) {
      if (cleaned.startsWith('237')) {
        cleaned = '+' + cleaned;
      } else if (cleaned.startsWith('6') || cleaned.startsWith('2')) {
        cleaned = '+237' + cleaned;
      } else {
        return null; // Format non reconnu
      }
    }

    // Validation finale
    const regex = /^\+237[62][0-9]{8}$|^\+2372[0-9]{8}$/;
    return regex.test(cleaned) ? cleaned : null;
  }
}