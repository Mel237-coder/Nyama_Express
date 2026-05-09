// ============================================
// Contrôleur de paiements
// Gère l'initiation et le suivi des paiements Mobile Money
// ============================================

import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { InitiatePaymentDto, CheckPaymentDto, RefundDto } from './dto/payment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('Paiements')
@Controller('payments')
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  @Post('initiate')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Initier un paiement' })
  async initiatePayment(@Body() dto: InitiatePaymentDto) {
    return this.paymentsService.initiatePayment(dto);
  }

  @Get('status/:paymentId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Vérifier le statut d\'un paiement' })
  async checkPayment(@Param('paymentId') paymentId: string) {
    return this.paymentsService.getPaymentStatus(paymentId);
  }

  @Get('history')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Historique des paiements' })
  async getHistory(@Query('page') page = 1, @Query('limit') limit = 20) {
    // L'userId viendra du JWT via le guard
    return { page, limit }; // Simplified - actual implementation needs CurrentUser
  }

  @Post('refund')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Effectuer un remboursement' })
  async refund(@Body() dto: RefundDto) {
    return this.paymentsService.refund(dto.orderId, dto.reason);
  }

  // ============================================
  // WEBHOOKS (publics - sans authentification)
  // ============================================

  @Public()
  @Post('mtn/callback')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Webhook MTN MoMo' })
  async mtnCallback(@Body() data: any) {
    await this.paymentsService.handleMtnCallback(data);
    return { received: true };
  }

  @Public()
  @Post('orange/callback')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Webhook Orange Money' })
  async orangeCallback(@Body() data: any) {
    // Traiter callback Orange Money
    return { received: true };
  }

  @Public()
  @Post('notchpay/callback')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Webhook NotchPay' })
  async notchpayCallback(@Body() data: any) {
    await this.paymentsService.handleNotchpayCallback(data);
    return { received: true };
  }

  @Public()
  @Get('notchpay/callback')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'NotchPay GET callback (，某些 providers utilisent GET)' })
  async notchpayGetCallback(@Query() query: any) {
    // Certains webhooks utilisent GET
    await this.paymentsService.handleNotchpayCallback(query);
    return { received: true };
  }
}