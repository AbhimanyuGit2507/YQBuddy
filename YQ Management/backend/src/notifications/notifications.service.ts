import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly evolutionApiUrl = process.env.EVOLUTION_API_URL;
  private readonly evolutionApiKey = process.env.EVOLUTION_API_KEY;
  private readonly instanceName = process.env.EVOLUTION_INSTANCE_NAME;

  constructor(@InjectQueue('whatsapp') private readonly whatsappQueue: Queue) {}

  async sendWhatsAppMessage(to: string, body: string) {
    await this.whatsappQueue.add('sendMessage', { to, body }, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 }
    });
  }

  async executeWhatsAppMessage(to: string, body: string) {
    try {
      if (this.evolutionApiUrl && this.evolutionApiKey && this.instanceName) {
        // Evolution API requires the number without 'whatsapp:' or '+'
        const cleanNumber = to.replace(/\D/g, '');
        
        const res = await fetch(`${this.evolutionApiUrl}/message/sendText/${this.instanceName}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': this.evolutionApiKey
          },
          body: JSON.stringify({
            number: cleanNumber,
            text: body
          })
        });
        
        if (!res.ok) {
           throw new Error(`Evolution API error: ${res.status} ${res.statusText}`);
        }
        this.logger.log(`Sent real WhatsApp message to ${cleanNumber} via Evolution API`);
      } else {
        // Mock implementation for development
        this.logger.warn(`[MOCK WHATSAPP] To: ${to} | Body: ${body}`);
      }
    } catch (error) {
      this.logger.error(`Failed to send WhatsApp message to ${to}`, error);
    }
  }

  async processWebhookReply(from: string, body: string) {
    this.logger.log(`Received reply from ${from}: ${body}`);
    const command = body.trim().toUpperCase();

    // Logic to lookup Token by phone number goes here
    if (command === 'LATE') {
      this.logger.log(`[Action] Moving customer ${from} back 2 spots in the queue`);
      await this.sendWhatsAppMessage(from, 'Your turn has been delayed. We will notify you again soon.');
    } else if (command === 'CANCEL') {
      this.logger.log(`[Action] Cancelling queue position for ${from}`);
      await this.sendWhatsAppMessage(from, 'You have been removed from the queue.');
    } else {
      await this.sendWhatsAppMessage(from, 'Unrecognized command. Reply LATE to delay your turn or CANCEL to leave the queue.');
    }
  }
}
