// ============================================
// Service d'authentification - Gestion OTP et JWT
// ============================================

import { Injectable, Logger, UnauthorizedException, ConflictException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { AfricaTalkingService } from '../common/sms/africa-talking.service';
import { OtpService } from '../common/sms/otp.service';
import { RequestOtpDto, VerifyOtpDto } from './dto/request-otp.dto';
import { UserRole, UserStatus } from '@prisma/client';

interface TokenPayload {
  sub: string;  // userId
  phone: string;
  role: UserRole;
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private africaTalking: AfricaTalkingService,
    private otpService: OtpService,
    private configService: ConfigService,
  ) {}

  // ============================================
  // REQUÊTE OTP
  // ============================================

  /**
   * Demande un code OTP pour un numéro de téléphone
   * Crée un nouvel utilisateur si nécessaire
   */
  async requestOtp(dto: RequestOtpDto): Promise<{ message: string; isNewUser: boolean }> {
    const { phone } = dto;
    const formattedPhone = this.formatPhone(phone);

    // Recherche utilisateur existant
    let user = await this.prisma.user.findUnique({
      where: { phone: formattedPhone },
    });

    const isNewUser = !user;

    // Nouvel utilisateur : créer le compte
    if (isNewUser) {
      // Vérifier qu'il n'existe pas (au cas où)
      const existing = await this.prisma.user.findFirst({
        where: {
          phone: {
            contains: formattedPhone.slice(-9), // Comparaison par suffixe
          },
        },
      });

      if (existing) {
        throw new ConflictException('Ce numéro est déjà enregistré');
      }

      user = await this.prisma.user.create({
        data: {
          phone: formattedPhone,
          role: UserRole.CLIENT, // Par défaut, nouveau = client
          status: UserStatus.PENDING,
        },
      });

      this.logger.log(`New user created: ${this.maskPhone(formattedPhone)}`);
    }

    // Générer et envoyer OTP
    const otp = this.otpService.generateOtp(formattedPhone);

    // Construction du message selon la langue
    const message = `Votre code FoodApp: ${otp}\nValide 5 minutes.\nNe partagez jamais ce code.`;

    // Envoyer par SMS
    const result = await this.africaTalking.sendSms({
      to: formattedPhone,
      message,
    });

    if (!result.success) {
      this.logger.error(`Failed to send OTP to ${this.maskPhone(formattedPhone)}: ${result.error}`);
      // En développement, on log le code quand même
      if (process.env.NODE_ENV === 'development') {
        this.logger.warn(`[DEV] OTP for ${this.maskPhone(formattedPhone)}: ${otp}`);
      }
      throw new UnauthorizedException('Échec de l\'envoi du SMS. Veuillez réessayer.');
    }

    this.logger.log(`OTP sent to ${this.maskPhone(formattedPhone)}`);
    return {
      message: isNewUser
        ? 'Un code de vérification a été envoyé à votre numéro.'
        : 'Un code de vérification a été envoyé.',
      isNewUser,
    };
  }

  // ============================================
  // VÉRIFICATION OTP
  // ============================================

  /**
   * Vérifie le code OTP et retourne les tokens JWT
   */
  async verifyOtp(dto: VerifyOtpDto): Promise<{
    accessToken: string;
    refreshToken: string;
    user: any;
    requiresProfile: boolean;
  }> {
    const { phone, code } = dto;
    const formattedPhone = this.formatPhone(phone);

    // Valider OTP
    const validation = this.otpService.validateOtp(formattedPhone, code);
    if (!validation.valid) {
      throw new UnauthorizedException(validation.error);
    }

    // Récupérer l'utilisateur
    const user = await this.prisma.user.findUnique({
      where: { phone: formattedPhone },
      include: { documents: true },
    });

    if (!user) {
      throw new UnauthorizedException('Utilisateur non trouvé');
    }

    // Mettre à jour le statut
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        status: UserStatus.ACTIVE,
        lastLoginAt: new Date(),
      },
    });

    // Générer les tokens
    const tokens = await this.generateTokens(user);

    // Sauvegarder le refresh token
    await this.saveRefreshToken(user.id, tokens.refreshToken);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: this.sanitizeUser(user),
      requiresProfile: !user.firstName, // Demander de compléter le profil si pas de nom
    };
  }

  // ============================================
  // RAFRAÎCHISSEMENT TOKEN
  // ============================================

  /**
   * Rafraîchit le token d'accès
   */
  async refreshTokens(refreshToken: string): Promise<AuthTokens> {
    try {
      // Vérifier le token
      const payload = this.jwtService.verify<TokenPayload>(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });

      // Vérifier en base
      const session = await this.prisma.session.findFirst({
        where: {
          userId: payload.sub,
          refreshToken,
          revokedAt: null,
        },
      });

      if (!session) {
        throw new UnauthorizedException('Session invalide');
      }

      // Vérifier expiration
      if (new Date(session.expiresAt) < new Date()) {
        await this.prisma.session.update({
          where: { id: session.id },
          data: { revokedAt: new Date() },
        });
        throw new UnauthorizedException('Session expirée');
      }

      // Générer nouveaux tokens
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user || user.status !== UserStatus.ACTIVE) {
        throw new UnauthorizedException('Utilisateur inactif');
      }

      const tokens = await this.generateTokens(user);

      // Mettre à jour le refresh token
      await this.prisma.session.update({
        where: { id: session.id },
        data: {
          refreshToken: tokens.refreshToken,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 jours
        },
      });

      return tokens;
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      this.logger.error(`Token refresh failed: ${error.message}`);
      throw new UnauthorizedException('Token invalide');
    }
  }

  // ============================================
  // DÉCONNEXION
  // ============================================

  /**
   * Révoque la session courante
   */
  async logout(userId: string): Promise<void> {
    await this.prisma.session.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  // ============================================
  // GÉNÉRATION TOKENS
  // ============================================

  private async generateTokens(user: any): Promise<AuthTokens> {
    const payload: TokenPayload = {
      sub: user.id,
      phone: user.phone,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: '7d',
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: '30d',
    });

    return { accessToken, refreshToken };
  }

  private async saveRefreshToken(userId: string, token: string): Promise<void> {
    // Supprimer les anciennes sessions
    await this.prisma.session.deleteMany({
      where: { userId, revokedAt: { not: null } },
    });

    // Créer nouvelle session
    await this.prisma.session.create({
      data: {
        userId,
        refreshToken: token,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });
  }

  // ============================================
  // UTILITAIRES
  // ============================================

  /**
   * Formate un numéro de téléphone camerounais
   */
  private formatPhone(phone: string): string {
    let cleaned = phone.replace(/[\s\-]/g, '');

    if (cleaned.startsWith('00')) {
      cleaned = '+' + cleaned.substring(2);
    } else if (!cleaned.startsWith('+')) {
      if (cleaned.startsWith('237')) {
        cleaned = '+' + cleaned;
      } else if (cleaned.startsWith('6') || cleaned.startsWith('2')) {
        cleaned = '+237' + cleaned;
      }
    }

    return cleaned;
  }

  /**
   * Retire les données sensibles du profil utilisateur
   */
  private sanitizeUser(user: any): any {
    const { passwordHash, otpAttempts, lastOtpAt, ...rest } = user;
    return rest;
  }

  private maskPhone(phone: string): string {
    if (!phone || phone.length < 4) return '****';
    return phone.slice(0, 4) + '****' + phone.slice(-2);
  }
}