import { IsString, IsNumber, IsOptional, IsEnum } from 'class-validator';

export class InitiatePaymentDto {
  @IsString()
  orderId: string;

  @IsNumber()
  amount: number;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  email?: string;

  @IsEnum(['MTN_MOMO', 'ORANGE_MONEY', 'CASH', 'NOTCHPAY'])
  paymentMethod: 'MTN_MOMO' | 'ORANGE_MONEY' | 'CASH' | 'NOTCHPAY';
}

export class CheckPaymentDto {
  @IsString()
  paymentId: string;
}

export class RefundDto {
  @IsString()
  orderId: string;

  @IsString()
  reason: string;
}