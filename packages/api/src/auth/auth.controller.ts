// ============================================
// Contrôleur d'authentification - Endpoints OTP
// ============================================

import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RequestOtpDto, VerifyOtpDto } from './dto/request-otp.dto';

@ApiTags('Authentification')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('request-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Demander un code OTP' })
  @ApiResponse({ status: 200, description: 'Code OTP envoyé par SMS' })
  @ApiResponse({ status: 400, description: 'Numéro invalide' })
  @ApiResponse({ status: 429, description: 'Trop de requêtes' })
  async requestOtp(@Body() dto: RequestOtpDto) {
    const result = await this.authService.requestOtp(dto);
    return {
      success: true,
      ...result,
    };
  }

  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Vérifier le code OTP et obtenir les tokens' })
  @ApiResponse({ status: 200, description: 'Tokens JWT générés' })
  @ApiResponse({ status: 401, description: 'Code invalide ou expiré' })
  async verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtp(dto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rafraîchir le token d\'accès' })
  @ApiResponse({ status: 200, description: 'Nouveau token généré' })
  @ApiResponse({ status: 401, description: 'Refresh token invalide' })
  async refresh(@Body('refreshToken') refreshToken: string) {
    return this.authService.refreshTokens(refreshToken);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Déconnexion' })
  @ApiResponse({ status: 200, description: 'Déconnecté avec succès' })
  async logout(@Body('userId') userId: string) {
    await this.authService.logout(userId);
    return { success: true, message: 'Déconnexion réussie' };
  }
}