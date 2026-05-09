// ============================================
// Module de paiements
// Gère MTN MoMo, Orange Money et NotchPay
// ============================================

import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { MtnMomoService } from './mtn-momo.service';
import { NotchpayService } from './notchpay.service';
import { PrismaService } from '../prisma/prisma.service';
import { AfricaTalkingService } from '../common/sms/africa-talking.service';

@Module({
  controllers: [PaymentsController],
  providers: [
    PaymentsService,
    MtnMomoService,
    NotchpayService,
    PrismaService,
    AfricaTalkingService,
  ],
  exports: [PaymentsService, MtnMomoService],
})
export class PaymentsModule {}