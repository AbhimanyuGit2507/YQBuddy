import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WebhookUrlValidator } from './webhook-url-validator.service';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(
    private prisma: PrismaService,
    private readonly urlValidator: WebhookUrlValidator,
  ) {}

  async createWebhook(
    workspaceId: string,
    url: string,
    secret: string | null,
    events: string[],
  ) {
    await this.urlValidator.validate(url);

    return this.prisma.webhookEndpoint.create({
      data: { workspaceId, url, secret, events },
    });
  }

  async getWebhooks(workspaceId: string) {
    return this.prisma.webhookEndpoint.findMany({ where: { workspaceId } });
  }

  async deleteWebhook(id: string) {
    return this.prisma.webhookEndpoint.delete({ where: { id } });
  }

  async triggerWebhooks(workspaceId: string, eventName: string, payload: any) {
    const endpoints = await this.prisma.webhookEndpoint.findMany({
      where: {
        workspaceId,
        active: true,
        events: { has: eventName },
      },
    });

    for (const endpoint of endpoints) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);

        await fetch(endpoint.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-yq-event': eventName,
          },
          body: JSON.stringify({
            event: eventName,
            data: payload,
            timestamp: new Date(),
          }),
          signal: controller.signal,
        });

        clearTimeout(timeout);
        this.logger.log(
          `Triggered webhook ${eventName} for workspace ${workspaceId} at ${endpoint.url}`,
        );
      } catch (error) {
        this.logger.error(`Failed to trigger webhook ${endpoint.url}`, error);
      }
    }
  }
}
