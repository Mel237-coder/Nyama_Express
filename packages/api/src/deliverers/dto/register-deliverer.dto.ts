import { IsString, IsEnum, IsOptional, IsNotEmpty } from 'class-validator';
import { VehicleType } from '@prisma/client';

export class RegisterDelivererDto {
  @IsString() @IsNotEmpty() phone: string;
  @IsString() @IsNotEmpty() firstName: string;
  @IsString() @IsNotEmpty() lastName: string;
  @IsString() @IsNotEmpty() cniNumber: string;
  @IsString() @IsNotEmpty() cniPhotoUrl: string;
  @IsString() @IsNotEmpty() selfieUrl: string;
  @IsEnum(VehicleType) vehicleType: VehicleType;
  @IsString() @IsOptional() vehiclePlate?: string;
  @IsString() @IsNotEmpty() zoneId: string;
}
