import { Module } from '@nestjs/common';
import { PlansService } from './plans.service';
import { PlansController } from './plans.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { BillingModule } from '../billing/billing.module';
import { PermissionsModule } from '../permissions/permissions.module';

import { PublicPlansController } from './public-plans.controller';

@Module({
  imports: [PrismaModule, BillingModule, PermissionsModule],
  controllers: [PlansController, PublicPlansController],
  providers: [PlansService],
  exports: [PlansService],
})
export class PlansModule {}
