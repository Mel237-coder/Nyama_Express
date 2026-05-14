import { IsEmail, IsString, IsOptional, MinLength, Matches } from 'class-validator';
import { Transform } from 'class-transformer';

export class RequestOtpDto {
  @IsEmail({}, { message: 'Adresse e-mail invalide' })
  @Transform(({ value }) => value?.trim().toLowerCase())
  email: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  @Matches(/^(\+237)?[62][0-9]{8}$|^(\+237)?2[0-9]{8}$/, {
    message: 'Numéro de téléphone camerounais invalide (6xx xxx xxx ou 2xx xxx xxx)',
  })
  phone?: string;
}
