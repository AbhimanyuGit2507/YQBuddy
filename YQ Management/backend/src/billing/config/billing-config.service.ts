import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PaymentProviderName } from '@prisma/client';

@Injectable()
export class BillingConfigService {
  private readonly logger = new Logger(BillingConfigService.name);

  constructor(private readonly prisma: PrismaService) {}

  getOzowSiteCode(): string {
    return process.env.OZOW_SITE_CODE || '';
  }

  getOzowPrivateKey(): string {
    return process.env.OZOW_PRIVATE_KEY || '';
  }

  getOzowApiKey(): string {
    return process.env.OZOW_API_KEY || '';
  }

  getOzowBaseUrl(): string {
    return process.env.OZOW_BASE_URL || 'https://pay.ozow.com';
  }

  getOzowSandbox(): boolean {
    const val = process.env.OZOW_SANDBOX;
    if (val !== undefined) {
      return val === 'true';
    }
    return true;
  }

  getOzowWebhookSecret(): string {
    return process.env.OZOW_WEBHOOK_SECRET || '';
  }

  getBackendUrl(): string {
    return process.env.BACKEND_URL || 'http://localhost:3000';
  }

  getFrontendUrl(): string {
    return process.env.FRONTEND_URL || 'http://localhost:3001';
  }

  getBrevoApiKey(): string {
    return process.env.BREVO_API_KEY || '';
  }

  getBrevoListId(): number {
    return Number(process.env.BREVO_LIST_ID) || 2;
  }

  getJwtSecret(): string {
    return process.env.JWT_SECRET || '';
  }

  async getActivePaymentProviders(): Promise<PaymentProviderName[]> {
    const providers = await this.prisma.paymentProvider.findMany({
      where: { isActive: true },
    });
    return providers.map((p) => p.name);
  }

  async getDefaultPaymentProvider(): Promise<PaymentProviderName> {
    const provider = await this.prisma.paymentProvider.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'asc' },
    });
    if (!provider) {
      throw new Error('No active payment provider configured');
    }
    return provider.name;
  }

  async ensurePaymentProvidersExist(): Promise<void> {
    const existing = await this.prisma.paymentProvider.count();
    if (existing === 0) {
      await this.prisma.paymentProvider.create({
        data: {
          name: PaymentProviderName.OZOW,
          sandboxEnabled: this.getOzowSandbox(),
          siteCode: this.getOzowSiteCode(),
          privateKey: this.getOzowPrivateKey(),
          apiKey: this.getOzowApiKey(),
          baseUrl: this.getOzowBaseUrl(),
          webhookSecret: this.getOzowWebhookSecret(),
          isActive: true,
          config: {
            sandbox: this.getOzowSandbox(),
            countryCode: 'ZA',
          },
        },
      });
      this.logger.log('Default Ozow payment provider seed created');
    }
  }
}
