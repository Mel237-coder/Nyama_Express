// ============================================
// Service d'authentification - Gestion OTP et JWT
// ============================================

import { Injectable, Logger, UnauthorizedException, ConflictException, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../common/email/email.service';
import { OtpService } from '../common/sms/otp.service';
import { RequestOtpDto } from './dto/request-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { UserRole, UserStatus } from '@prisma/client';

interface TokenPayload {
  sub: string;  // userId
  email: string;
  role: UserRole;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private emailService: EmailService,
    private otpService: OtpService,
    private configService: ConfigService,
  ) {}

  // ============================================
  // REQUÊTE OTP
  // ============================================

  /**
   * Demande un code OTP pour un email
   * Crée un nouvel utilisateur si nécessaire
   */
  async requestOtp(dto: RequestOtpDto): Promise<{ message: string; isNewUser: boolean; devOtp?: string }> {
    const { email, phone } = dto;

    // Recherche utilisateur existant par email
    let user = await this.prisma.user.findUnique({
      where: { email },
    });

    const isNewUser = !user;

    // Nouvel utilisateur : créer le compte
    if (isNewUser) {
      user = await this.prisma.user.create({
        data: {
          email,
          phone: phone || null,
          role: UserRole.CLIENT,
          status: UserStatus.PENDING,
        },
      });

      this.logger.log(`New user created: ${this.maskEmail(email)}`);
    }

    if (!user) {
      throw new UnauthorizedException('Impossible de créer ou trouver l\'utilisateur');
    }

    if (phone && !user.phone) {
      // Mettre à jour le téléphone si fourni et absent
      await this.prisma.user.update({
        where: { id: user.id },
        data: { phone },
      });
    }

    // Générer et envoyer OTP
    const otp = this.otpService.generateOtp(email);

    // Envoyer par email
    const result = await this.emailService.sendOtp(email, otp);

    if (!result.success) {
      this.logger.error(`Failed to send OTP to ${this.maskEmail(email)}: ${result.error}`);

      // En développement, on simule l'envoi pour permettre les tests
      if (process.env.NODE_ENV === 'development') {
        this.logger.warn(`[DEV] OTP for ${this.maskEmail(email)}: ${otp}`);
        return {
          message: isNewUser
            ? 'Un code de vérification a été envoyé à votre adresse e-mail.'
            : 'Un code de vérification a été envoyé.',
          isNewUser,
          devOtp: otp,
        };
      }

      throw new ServiceUnavailableException('Échec de l\'envoi de l\'e-mail. Veuillez réessayer.');
    }

    this.logger.log(`OTP sent to ${this.maskEmail(email)}`);
    return {
      message: isNewUser
        ? 'Un code de vérification a été envoyé à votre adresse e-mail.'
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
    const { email, code } = dto;

    // Valider OTP
    const validation = this.otpService.validateOtp(email, code);
    if (!validation.valid) {
      throw new UnauthorizedException(validation.error);
    }

    // Récupérer l'utilisateur
    const user = await this.prisma.user.findUnique({
      where: { email },
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
      requiresProfile: !user.firstName,
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
      const payload = this.jwtService.verify<TokenPayload>(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });

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

      if (new Date(session.expiresAt) < new Date()) {
        await this.prisma.session.update({
          where: { id: session.id },
          data: { revokedAt: new Date() },
        });
        throw new UnauthorizedException('Session expirée');
      }

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user || user.status !== UserStatus.ACTIVE) {
        throw new UnauthorizedException('Utilisateur inactif');
      }

      const tokens = await this.generateTokens(user);

      await this.prisma.session.update({
        where: { id: session.id },
        data: {
          refreshToken: tokens.refreshToken,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
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
      email: user.email,
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
    await this.prisma.session.deleteMany({
      where: { userId, revokedAt: { not: null } },
    });

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

  private sanitizeUser(user: any): any {
    const { passwordHash, otpAttempts, lastOtpAt, ...rest } = user;
    return rest;
  }

  private maskEmail(email: string): string {
    if (!email || !email.includes('@')) return '****';
    const [local, domain] = email.split('@');
    const maskedLocal = local.length > 2 ? local.slice(0, 2) + '***' : '***';
    return `${maskedLocal}@${domain}`;
  }
}
