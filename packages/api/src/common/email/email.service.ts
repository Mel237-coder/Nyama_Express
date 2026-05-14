import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

export interface SendEmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    const host = this.configService.get<string>('SMTP_HOST') || 'smtp.gmail.com';
    const port = parseInt(this.configService.get<string>('SMTP_PORT') || '587', 10);
    const user = this.configService.get<string>('SMTP_USER') || '';
    const pass = this.configService.get<string>('SMTP_PASS') || '';

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: user && pass ? { user, pass } : undefined,
    });
  }

  async sendEmail(options: SendEmailOptions): Promise<{ success: boolean; error?: string }> {
    const from = this.configService.get<string>('SMTP_FROM') || 'FoodApp Cameroun <noreply@foodapp.cm>';

    try {
      await this.transporter.sendMail({
        from,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html || options.text,
      });

      this.logger.log(`Email sent to ${options.to}`);
      return { success: true };
    } catch (error: any) {
      this.logger.error(`Failed to send email to ${options.to}: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  async sendOtp(email: string, otp: string): Promise<{ success: boolean; error?: string }> {
    const subject = 'Votre code de vérification FoodApp Cameroun';
    const text = `Bonjour,

Votre code de vérification FoodApp est : ${otp}

Ce code est valide pendant 5 minutes. Ne le partagez avec personne.

Si vous n'avez pas demandé ce code, ignorez simplement cet e-mail.

Cordialement,
L'équipe FoodApp Cameroun`;

    const html = `<div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; background: #0A0A0F; color: #fff; border-radius: 16px; border: 1px solid rgba(255,255,255,0.08);">
  <h2 style="color: #FFD600; margin-top: 0;">FoodApp Cameroun</h2>
  <p>Bonjour,</p>
  <p>Votre code de vérification est :</p>
  <div style="font-size: 32px; font-weight: bold; color: #FFD600; letter-spacing: 8px; text-align: center; margin: 24px 0; background: rgba(255,255,255,0.03); padding: 16px; border-radius: 12px; border: 1px solid rgba(255,214,0,0.3);">${otp}</div>
  <p style="color: rgba(255,255,255,0.6); font-size: 14px;">Ce code est valide pendant <strong>5 minutes</strong>. Ne le partagez avec personne.</p>
  <hr style="border: none; border-top: 1px solid rgba(255,255,255,0.08); margin: 24px 0;">
  <p style="color: rgba(255,255,255,0.4); font-size: 12px;">Si vous n'avez pas demandé ce code, ignorez simplement cet e-mail.</p>
</div>`;

    return this.sendEmail({ to: email, subject, text, html });
  }
}
