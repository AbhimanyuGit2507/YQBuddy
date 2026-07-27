import { Injectable, Logger, Inject } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue, Job } from 'bullmq';
import type { WhatsAppProvider } from '../communication/interfaces/whatsapp.provider';
import {
  CommunicationLogService,
  CommunicationChannel,
  CommunicationStatus,
} from '../communication/logging/communication-log.service';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly evolutionApiUrl = process.env.EVOLUTION_API_URL;
  private readonly evolutionApiKey = process.env.EVOLUTION_API_KEY;
  private readonly instanceName = process.env.EVOLUTION_INSTANCE_NAME;

  constructor(
    @InjectQueue('whatsapp') private readonly whatsappQueue: Queue,
    @Inject('WhatsAppProvider')
    private readonly whatsappProvider: WhatsAppProvider,
    private readonly communicationLogService: CommunicationLogService,
  ) {}

  async sendWhatsAppMessage(to: string, body: string, workspaceId?: string) {
    await this.whatsappQueue.add(
      'sendMessage',
      { to, body, workspaceId },
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
      },
    );
  }

  async executeWhatsAppMessage(job: Job<any, any, string>) {
    const { to, body, workspaceId } = job.data;
    try {
      const result = await this.whatsappProvider.sendText(to, body);

      await this.communicationLogService.log({
        channel: CommunicationChannel.WHATSAPP,
        type: 'message',
        recipient: to,
        body,
        status: result.success
          ? CommunicationStatus.SENT
          : CommunicationStatus.FAILED,
        provider: 'evolution',
        providerId: result.providerId,
        errorMessage: result.error,
        workspaceId,
      });

      return result;
    } catch (error) {
      this.logger.error(`Failed to send WhatsApp message to ${to}`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
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
