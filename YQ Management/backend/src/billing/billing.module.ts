import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { BillingController } from './billing.controller';
import { PlansService } from '../plans/plans.service';
import { SubscriptionService } from '../subscription/subscription.service';
import { PaymentsService } from '../payments/payments.service';
import { InvoiceService } from '../invoice/invoice.service';
import { UsageService } from '../usage/usage.service';
import { ProviderRegistry } from './providers/provider-registry.service';
import { BillingConfigService } from './config/billing-config.service';
import { WebhookProcessService } from '../webhooks/webhook-process.service';

@Module({
  imports: [PrismaModule, AuthModule, PermissionsModule],
  controllers: [BillingController],
  providers: [
    PlansService,
    SubscriptionService,
    PaymentsService,
    InvoiceService,
    UsageService,
    ProviderRegistry,
    BillingConfigService,
    WebhookProcessService,
  ],
  exports: [
    PlansService,
    SubscriptionService,
    PaymentsService,
    InvoiceService,
    UsageService,
    ProviderRegistry,
    BillingConfigService,
    WebhookProcessService,
  ],
})
export class BillingModule {}
