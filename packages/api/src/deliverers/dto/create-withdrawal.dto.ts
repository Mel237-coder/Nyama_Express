import { IsNumber, IsString, IsNotEmpty, Min } from 'class-validator';

export class CreateWithdrawalDto {
  @IsNumber() @Min(500) amount: number;
  @IsString() @IsNotEmpty() provider: string;
  @IsString() @IsNotEmpty() providerAccount: string;
}
