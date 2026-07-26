import { Module } from '@nestjs/common';
import { WebhookProcessService } from './webhook-process.service';
import { WebhooksController } from './webhooks.controller';
import { WebhooksService } from './webhooks.service';
import { PrismaModule } from '../prisma/prisma.module';
import { BillingModule } from '../billing/billing.module';
import { PaymentsModule } from '../payments/payments.module';
import { SubscriptionModule } from '../subscription/subscription.module';
import { PermissionsModule } from '../permissions/permissions.module';

@Module({
  imports: [PrismaModule, BillingModule, PaymentsModule, SubscriptionModule, PermissionsModule],
  controllers: [WebhooksController],
  providers: [WebhookProcessService, WebhooksService],
  exports: [WebhookProcessService, WebhooksService],
})
export class WebhooksModule {}