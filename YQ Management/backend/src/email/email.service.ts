import { Injectable, Logger } from '@nestjs/common';
import { CommunicationService } from '../communication/communication.service';
import { CommunicationEvent } from '../communication/events/communication-events.enum';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private readonly communicationService: CommunicationService) {}

  async sendOTP(
    email: string,
    otpCode: string,
    purpose: 'signup' | 'login' | 'welcome',
  ) {
    try {
      if (purpose === 'signup') {
        await this.communicationService.publish(
          CommunicationEvent.SIGNUP_OTP_REQUESTED,
          {
            email,
            otp: otpCode,
          },
        );
      } else if (purpose === 'login') {
        await this.communicationService.publish(
          CommunicationEvent.LOGIN_OTP_REQUESTED,
          {
            email,
            otp: otpCode,
          },
        );
      } else if (purpose === 'welcome') {
        await this.communicationService.publish(
          CommunicationEvent.MARKETING_WELCOME,
          {
            email,
            name: email.split('@')[0],
          },
        );
      }
    } catch (error) {
      this.logger.error(`Failed to send ${purpose} OTP to ${email}`, error);
    }
  }

  async sendLoginNotification(email: string) {
    try {
      await this.communicationService.publish(
        CommunicationEvent.USER_REGISTERED,
        {
          email,
          name: email.split('@')[0],
        },
      );
    } catch (error) {
      this.logger.error(`Failed to send login notification to ${email}`, error);
    }
  }

  async addContactToMarketingList(email: string) {
    this.logger.log(`Adding ${email} to marketing list (Brevo contact sync)`);
  }
}
