import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { createBrandEmailLayout, generateOtpBoxHtml } from './email-layout';

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
      let title = '';
      let bodyContent = '';
      if (purpose === 'signup') {
        subject = 'Verify your Qmova Account';
        title = 'Account Verification';
        bodyContent = `<h2 style="color: #111827; margin-top: 0; font-size: 22px; font-weight: 700;">Verify Your Email Address</h2>
        <p style="color: #4b5563; line-height: 1.6;">Thank you for registering with Qmova. Please use the verification code below to complete your account authentication:</p>
        ${generateOtpBoxHtml(otpCode)}
        <p style="color: #4b5563; line-height: 1.6; font-size: 14px;">This verification code is valid for <strong>10 minutes</strong>. For security purposes, do not disclose this code to anyone. If you did not initiate this request, simply disregard this message.</p>`;
      } else if (purpose === 'login') {
        subject = 'Your Qmova Authentication Code';
        title = 'Login Verification';
        bodyContent = `<h2 style="color: #111827; margin-top: 0; font-size: 22px; font-weight: 700;">Login Authentication Code</h2>
        <p style="color: #4b5563; line-height: 1.6;">A sign-in request was initiated for your Qmova account. Enter the verification code below to proceed securely:</p>
        ${generateOtpBoxHtml(otpCode)}
        <p style="color: #4b5563; line-height: 1.6; font-size: 14px;">This code expires in <strong>10 minutes</strong>. If you did not attempt to sign in, please review your account security immediately or contact support.</p>`;
      } else {
        subject = 'Reset your Qmova Password';
        title = 'Password Reset Code';
        bodyContent = `<h2 style="color: #111827; margin-top: 0; font-size: 22px; font-weight: 700;">Password Reset Verification</h2>
        <p style="color: #4b5563; line-height: 1.6;">We received a request to reset the password associated with your Qmova account. Use the verification code below to authorize this change:</p>
        ${generateOtpBoxHtml(otpCode)}
        <p style="color: #4b5563; line-height: 1.6; font-size: 14px;">This verification code is valid for <strong>10 minutes</strong>. If you did not request a password reset, no action is required and your existing password remains safe.</p>`;
      }

      const htmlContent = createBrandEmailLayout({
        title,
        preheader: `Your verification code is ${otpCode}. Valid for 10 minutes.`,
        content: bodyContent,
      });

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

      const htmlContent = createBrandEmailLayout({
        title: 'Security Notice: New Login Detected',
        preheader: 'A successful login occurred on your Qmova account.',
        content: `<h2 style="color: #111827; margin-top: 0; font-size: 22px; font-weight: 700;">Security Notification</h2>
        <p style="color: #4b5563; line-height: 1.6;">We observed a successful login to your Qmova account on <strong>${new Date().toLocaleString()}</strong>.</p>
        <p style="color: #4b5563; line-height: 1.6;">If this login activity was initiated by you, no further action is required. If you do not recognize this access, please change your password immediately to secure your account.</p>`,
      });

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
          subject: 'Security Alert: New login to your Qmova Account',
          htmlContent,
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
