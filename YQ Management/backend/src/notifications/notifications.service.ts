import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { WhatsappService } from '../whatsapp/whatsapp.service';

@Injectable()
export class NotificationsService implements OnModuleInit {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly instanceName = process.env.EVOLUTION_INSTANCE_NAME || '';
  private evolutionApiConfigured = false;

  constructor(
    @InjectQueue('whatsapp') private readonly whatsappQueue: Queue,
    private readonly whatsappService: WhatsappService,
  ) {}

  onModuleInit() {
    this.evolutionApiConfigured = !!this.instanceName;
  }

  async sendWhatsAppMessage(to: string, body: string) {
    await this.whatsappQueue.add(
      'sendMessage',
      { to, body },
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
      },
    );
  }

  async executeWhatsAppMessage(to: string, body: string) {
    if (!this.instanceName) {
      this.logger.warn(
        `[MOCK WHATSAPP] Evolution instance not configured. To: ${to} | Body: ${body}`,
      );
      return { success: true, mock: true };
    }

    try {
      const cleanNumber = to.replace(/\D/g, '');
      if (!cleanNumber) {
        this.logger.warn(`Invalid phone number for WhatsApp message: ${to}`);
        return { success: false, error: 'Invalid phone number' };
      }

      if (!body || !body.trim()) {
        this.logger.warn(`Empty body for WhatsApp message to ${cleanNumber}`);
        return { success: false, error: 'Empty message body' };
      }

      const result = await this.whatsappService.sendMessage(
        this.instanceName,
        cleanNumber,
        body.trim(),
      );
      if (result.success) {
        this.logger.log(
          `Sent WhatsApp message to ${cleanNumber} via ${this.instanceName}`,
        );
      } else {
        this.logger.error(
          `Failed to send WhatsApp message to ${cleanNumber}: ${result.error}`,
        );
      }
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Unexpected error sending WhatsApp message to ${to}: ${message}`,
        error,
      );
      return { success: false, error: message };
    }
  }

  async processWebhookReply(from: string, body: string) {
    this.logger.log(`Received reply from ${from}: ${body}`);
    const command = body.trim().toUpperCase();

    if (command === 'LATE') {
      this.logger.log(
        `[Action] Moving customer ${from} back 2 spots in the queue`,
      );
      await this.sendWhatsAppMessage(
        from,
        'Your turn has been delayed. We will notify you again soon.',
      );
    } else if (command === 'CANCEL') {
      this.logger.log(`[Action] Cancelling queue position for ${from}`);
      await this.sendWhatsAppMessage(
        from,
        'You have been removed from the queue.',
      );
    } else {
      await this.sendWhatsAppMessage(
        from,
        'Unrecognized command. Reply LATE to delay your turn or CANCEL to leave the queue.',
      );
    }
  }
}
