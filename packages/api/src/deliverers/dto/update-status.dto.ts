import { IsEnum, IsOptional, IsString } from 'class-validator';
import { DeliveryStatus } from '@prisma/client';

export class UpdateDelivererStatusDto {
  @IsEnum(DeliveryStatus) status: DeliveryStatus;
  @IsString() @IsOptional() orderId?: string;
}
