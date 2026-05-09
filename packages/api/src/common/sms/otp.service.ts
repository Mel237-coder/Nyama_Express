// ============================================
// Service OTP - Génération et validation des codes
// ============================================

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RandomStorageService } from './random-storage.service';

const OTP_LENGTH = 6;
const OTP_EXPIRY_SECONDS = 5 * 60; // 5 minutes
const MAX_ATTEMPTS = 3;

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);
  private readonly storage: RandomStorageService;

  constructor(private configService: ConfigService) {
    this.storage = new RandomStorageService();
  }

  /**
   * Génère un OTP et le stocke temporairement
   * @param phone - Numéro de téléphone
   * @returns Code OTP généré
   */
  generateOtp(phone: string): string {
    // Génère un code aléatoire de 6 chiffres
    const otp = this.generateRandomCode();

    // Stocke l'OTP avec métadonnées
    this.storage.set(phone, {
      code: otp,
      attempts: 0,
      createdAt: Date.now(),
      expiresAt: Date.now() + OTP_EXPIRY_SECONDS * 1000,
    });

    this.logger.debug(`OTP generated for ${this.maskPhone(phone)}: ${otp}`);
    return otp;
  }

  /**
   * Valide un OTP
   * @param phone - Numéro de téléphone
   * @param code - Code à vérifier
   * @returns true si valide, false sinon
   */
  validateOtp(phone: string, code: string): { valid: boolean; error?: string } {
    const stored = this.storage.get(phone);

    // Pas d'OTP trouvé
    if (!stored) {
      return { valid: false, error: 'Aucun code demandé. Veuillez demander un nouveau code.' };
    }

    // OTP expiré
    if (Date.now() > stored.expiresAt) {
      this.storage.delete(phone);
      return { valid: false, error: 'Code expiré. Veuillez demander un nouveau code.' };
    }

    // Trop de tentatives
    if (stored.attempts >= MAX_ATTEMPTS) {
      this.storage.delete(phone);
      return { valid: false, error: 'Trop de tentatives. Veuillez demander un nouveau code.' };
    }

    // Code incorrect
    if (stored.code !== code) {
      stored.attempts += 1;
      this.storage.set(phone, stored);
      const remaining = MAX_ATTEMPTS - stored.attempts;
      if (remaining > 0) {
        return { valid: false, error: `Code incorrect. Il vous reste ${remaining} tentative(s).` };
      }
      return { valid: false, error: 'Code incorrect. Veuillez demander un nouveau code.' };
    }

    // Succès - supprime l'OTP
    this.storage.delete(phone);
    return { valid: true };
  }

  /**
   * Génère un code numérique aléatoire
   */
  private generateRandomCode(): string {
    let code = '';
    for (let i = 0; i < OTP_LENGTH; i++) {
      code += Math.floor(Math.random() * 10).toString();
    }
    return code;
  }

  /**
   * Masque un numéro de téléphone pour les logs
   */
  private maskPhone(phone: string): string {
    if (phone.length < 4) return '****';
    return phone.slice(0, 4) + '****' + phone.slice(-2);
  }
}

/**
 * Stockage en mémoire pour les OTP
 * En production, utiliser Redis
 */
interface OtpData {
  code: string;
  attempts: number;
  createdAt: number;
  expiresAt: number;
}

class RandomStorageService {
  private store = new Map<string, OtpData>();

  set(key: string, value: OtpData): void {
    this.store.set(key, value);
    // Auto-cleanup après expiration
    setTimeout(() => {
      const stored = this.store.get(key);
      if (stored && Date.now() > stored.expiresAt) {
        this.store.delete(key);
      }
    }, OTP_EXPIRY_SECONDS * 1000);
  }

  get(key: string): OtpData | undefined {
    return this.store.get(key);
  }

  delete(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }
}