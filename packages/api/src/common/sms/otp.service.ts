// ============================================
// Service OTP - Génération et validation des codes
// ============================================

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

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
   * @param identifier - Email ou téléphone
   * @returns Code OTP généré
   */
  generateOtp(identifier: string): string {
    const otp = this.generateRandomCode();

    this.storage.set(identifier, {
      code: otp,
      attempts: 0,
      createdAt: Date.now(),
      expiresAt: Date.now() + OTP_EXPIRY_SECONDS * 1000,
    });

    this.logger.debug(`OTP generated for ${this.maskIdentifier(identifier)}: ${otp}`);
    return otp;
  }

  /**
   * Valide un OTP
   * @param identifier - Email ou téléphone
   * @param code - Code à vérifier
   */
  validateOtp(identifier: string, code: string): { valid: boolean; error?: string } {
    const stored = this.storage.get(identifier);

    if (!stored) {
      return { valid: false, error: 'Aucun code demandé. Veuillez demander un nouveau code.' };
    }

    if (Date.now() > stored.expiresAt) {
      this.storage.delete(identifier);
      return { valid: false, error: 'Code expiré. Veuillez demander un nouveau code.' };
    }

    if (stored.attempts >= MAX_ATTEMPTS) {
      this.storage.delete(identifier);
      return { valid: false, error: 'Trop de tentatives. Veuillez demander un nouveau code.' };
    }

    if (stored.code !== code) {
      stored.attempts += 1;
      this.storage.set(identifier, stored);
      const remaining = MAX_ATTEMPTS - stored.attempts;
      if (remaining > 0) {
        return { valid: false, error: `Code incorrect. Il vous reste ${remaining} tentative(s).` };
      }
      return { valid: false, error: 'Code incorrect. Veuillez demander un nouveau code.' };
    }

    this.storage.delete(identifier);
    return { valid: true };
  }

  private generateRandomCode(): string {
    let code = '';
    for (let i = 0; i < OTP_LENGTH; i++) {
      code += Math.floor(Math.random() * 10).toString();
    }
    return code;
  }

  private maskIdentifier(identifier: string): string {
    if (identifier.includes('@')) {
      const [local, domain] = identifier.split('@');
      return local.slice(0, 2) + '***@' + domain;
    }
    if (identifier.length < 4) return '****';
    return identifier.slice(0, 4) + '****' + identifier.slice(-2);
  }
}

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
