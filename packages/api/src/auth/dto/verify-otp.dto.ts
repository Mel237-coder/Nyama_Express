import { IsString, Length, Matches } from 'class-validator';

export class VerifyOtpDto {
  @IsString()
  @Length(6, 6, { message: 'Le code OTP doit contenir 6 chiffres' })
  @Matches(/^\d{6}$/, { message: 'Le code OTP doit contenir uniquement des chiffres' })
  code: string;

  @IsString()
  phone: string;
}

export class RefreshTokenDto {
  @IsString()
  refreshToken: string;
}