import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly apiKey: string;
  private readonly senderEmail: string;
  private readonly senderName: string;

  constructor() {
    this.apiKey = process.env.BREVO_API_KEY || '';
    this.senderEmail = process.env.BREVO_SENDER_EMAIL || 'yqbuddysa@gmail.com';
    this.senderName = process.env.BREVO_SENDER_NAME || 'Qmova';
  }

  async sendOTP(email: string, otpCode: string, purpose: 'signup' | 'login' | 'reset') {
    try {
      if (!this.apiKey) {
        this.logger.warn(`
=========================================================
 📨 MOCK EMAIL SENT (No BREVO_API_KEY found)
---------------------------------------------------------
 To:      ${email}
 Purpose: ${purpose.toUpperCase()}
 OTP:     ${otpCode}
=========================================================
        `);
        return;
      }

      let subject = '';
      if (purpose === 'signup') subject = 'Verify your Qmova Account';
      else if (purpose === 'login') subject = 'Your Qmova Login Code';
      else subject = 'Reset your Qmova Password';

      const htmlContent = `<html><body><h2>Your OTP Code is: <strong>${otpCode}</strong></h2><p>This code will expire in 10 minutes.</p></body></html>`;

      const res = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          accept: 'application/json',
          'api-key': this.apiKey,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          sender: {
            name: `${this.senderName} Authentication`,
            email: this.senderEmail,
          },
          to: [{ email }],
          subject,
          htmlContent,
        }),
        signal: AbortSignal.timeout(10000),
      });

      if (!res.ok) {
        const error = await res.text();
        throw new InternalServerErrorException(`Brevo API error: ${error}`);
      }

      this.logger.log(`Sent ${purpose} OTP to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send OTP to ${email}`, error);
    }
  }

  async sendLoginNotification(email: string) {
    try {
      if (!this.apiKey) return;

      const res = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          accept: 'application/json',
          'api-key': this.apiKey,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          sender: { name: `${this.senderName} Security`, email: this.senderEmail },
          to: [{ email }],
          subject: 'New login to your Qmova Account',
          htmlContent: `<html><body><p>We detected a new login to your Qmova account at ${new Date().toLocaleString()}.</p></body></html>`,
        }),
        signal: AbortSignal.timeout(10000),
      });

      if (!res.ok) {
        const error = await res.text();
        throw new InternalServerErrorException(`Brevo API error: ${error}`);
      }
    } catch (error) {
      this.logger.error(`Failed to send login notification to ${email}`, error);
    }
  }

  async addContactToMarketingList(email: string) {
    try {
      if (!this.apiKey) {
        this.logger.warn(
          `BREVO_API_KEY missing. Skipped adding ${email} to marketing list.`,
        );
        return;
      }

      const listId = Number(process.env.BREVO_LIST_ID) || 2;

      const res = await fetch('https://api.brevo.com/v3/contacts', {
        method: 'POST',
        headers: {
          accept: 'application/json',
          'api-key': this.apiKey,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          email,
          listIds: [listId],
          updateEnabled: true,
        }),
        signal: AbortSignal.timeout(10000),
      });

      if (!res.ok) {
        const errorText = await res.text();
        // Ignore duplicate contact error
        if (
          errorText.includes('duplicate_parameter') ||
          errorText.includes('Contact already exist')
        ) {
          return;
        }
        throw new InternalServerErrorException(`Brevo API error: ${errorText}`);
      }

      this.logger.log(`Added ${email} to Brevo marketing list`);
    } catch (error: any) {
      this.logger.error(
        `Failed to add contact to marketing list: ${email}`,
        error,
      );
    }
  }
}
