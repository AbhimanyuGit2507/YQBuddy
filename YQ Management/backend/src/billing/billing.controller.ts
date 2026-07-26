import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';
import { WorkspaceGuard } from '../auth/workspace.guard';
import { PlansService } from '../plans/plans.service';
import { SubscriptionService } from '../subscription/subscription.service';
import { PaymentsService } from '../payments/payments.service';
import { InvoiceService } from '../invoice/invoice.service';
import { UsageService } from '../usage/usage.service';
import { CreatePlanDto } from '../plans/dto/plan.dto';
import { CreateSubscriptionDto } from '../subscription/dto/subscription.dto';
import { UpgradeSubscriptionDto } from '../subscription/dto/subscription.dto';
import { DowngradeSubscriptionDto } from '../subscription/dto/subscription.dto';
import { CancelSubscriptionDto } from '../subscription/dto/subscription.dto';
import { ResumeSubscriptionDto } from '../subscription/dto/subscription.dto';
import { CreatePaymentDto } from '../payments/dto/payment.dto';
import { UuidPipe } from '../common/pipes/validation.pipes';

@Controller('billing')
@UseGuards(AuthGuard('jwt'), RolesGuard, WorkspaceGuard)
@Roles(Role.ADMIN, Role.OPERATOR)
export class BillingController {
  constructor(
    private readonly plansService: PlansService,
    private readonly subscriptionService: SubscriptionService,
    private readonly paymentsService: PaymentsService,
    private readonly invoiceService: InvoiceService,
    private readonly usageService: UsageService,
  ) {}

  @Get('workspace')
  async getWorkspaceBilling(@Request() req: any) {
    const workspaceId = req.user.workspaceId;
    const [subscription, transactions, usage] = await Promise.all([
      this.subscriptionService.getSubscription(workspaceId),
      this.paymentsService.getTransactionHistory(workspaceId, 0, 20),
      this.usageService.getUsage(workspaceId),
    ]);

    return {
      subscription,
      transactions,
      usage,
      billingSettings: null,
    };
  }

  @Get('workspace/usage')
  async getUsage(
    @Request() req: any,
    @Query('periodStart') periodStart?: string,
    @Query('periodEnd') periodEnd?: string,
  ) {
    const ps = periodStart ? new Date(periodStart) : undefined;
    const pe = periodEnd ? new Date(periodEnd) : undefined;
    return this.usageService.getUsage(req.user.workspaceId, ps, pe);
  }

  @Get('workspace/subscription')
  async getCurrentSubscription(@Request() req: any) {
    return this.subscriptionService.getSubscription(req.user.workspaceId);
  }

  @Post('workspace/subscription')
  @Roles(Role.ADMIN)
  async createSubscription(
    @Request() req: any,
    @Body() dto: CreateSubscriptionDto,
  ) {
    return this.subscriptionService.createSubscription(
      req.user.workspaceId,
      dto,
    );
  }

  @Post('workspace/subscription/trial')
  @Roles(Role.ADMIN)
  async startTrial(
    @Request() req: any,
    @Body() body: { planId: string; trialDays: number },
  ) {
    return this.subscriptionService.startFreeTrial(
      req.user.workspaceId,
      body.planId,
      body.trialDays,
    );
  }

  @Put('workspace/subscription/upgrade')
  @Roles(Role.ADMIN)
  async upgradeSubscription(
    @Request() req: any,
    @Body() dto: UpgradeSubscriptionDto,
  ) {
    return this.subscriptionService.upgradeSubscription(
      req.user.workspaceId,
      dto,
    );
  }

  @Put('workspace/subscription/downgrade')
  @Roles(Role.ADMIN)
  async downgradeSubscription(
    @Request() req: any,
    @Body() dto: DowngradeSubscriptionDto,
  ) {
    return this.subscriptionService.downgradeSubscription(
      req.user.workspaceId,
      dto,
    );
  }

  @Post('workspace/subscription/cancel')
  @Roles(Role.ADMIN)
  async cancelSubscription(
    @Request() req: any,
    @Body() dto: CancelSubscriptionDto,
  ) {
    return this.subscriptionService.cancelSubscription(
      req.user.workspaceId,
      dto,
    );
  }

  @Post('workspace/subscription/resume')
  @Roles(Role.ADMIN)
  async resumeSubscription(
    @Request() req: any,
    @Body() dto: ResumeSubscriptionDto,
  ) {
    return this.subscriptionService.resumeSubscription(
      req.user.workspaceId,
      dto,
    );
  }

  @Get('workspace/subscription/history')
  async getSubscriptionHistory(
    @Request() req: any,
    @Query('offset') offset?: number,
    @Query('limit') limit?: number,
  ) {
    return this.subscriptionService.getSubscriptionHistory(
      req.user.workspaceId,
      offset ?? 0,
      limit ?? 50,
    );
  }

  @Post('workspace/subscription/renew')
  @Roles(Role.ADMIN)
  async renewSubscription(@Request() req: any) {
    return this.subscriptionService.renewSubscription(req.user.workspaceId);
  }

  @Post('workspace/subscription/expire-trial')
  @Roles(Role.ADMIN)
  async expireTrial(@Request() req: any) {
    return this.subscriptionService.expireTrial(req.user.workspaceId);
  }
}

@Controller('billing/plans')
export class BillingPlansController {
  constructor(private readonly plansService: PlansService) {}

  @Get()
  async listPlans(
    @Query('status') statusFilter?: string,
    @Query('offset') offset?: number,
    @Query('limit') limit?: number,
  ) {
    return this.plansService.listPlans(statusFilter, offset ?? 0, limit ?? 50);
  }

  @Get(':id')
  async getPlan(@Param('id', UuidPipe) id: string) {
    return this.plansService.getPlan(id);
  }

  @Post()
  @Roles(Role.ADMIN)
  async createPlan(@Body() dto: CreatePlanDto) {
    return this.plansService.createPlan(dto);
  }

  @Put(':id')
  @Roles(Role.ADMIN)
  async updatePlan(@Param('id', UuidPipe) id: string, @Body() dto: CreatePlanDto) {
    return this.plansService.updatePlan(id, dto as any);
  }
}

@Controller('billing/payments')
export class BillingPaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('checkout')
  async createCheckout(@Request() req: any, @Body() dto: CreatePaymentDto) {
    return this.paymentsService.createCheckout(dto, req.user.workspaceId);
  }

  @Get('status/:transactionRef')
  async getPaymentStatus(@Param('transactionRef') transactionRef: string) {
    return this.paymentsService.getPaymentStatus(transactionRef);
  }

  @Get('history')
  async getTransactionHistory(
    @Request() req: any,
    @Query('offset') offset?: number,
    @Query('limit') limit?: number,
  ) {
    return this.paymentsService.getTransactionHistory(
      req.user.workspaceId,
      offset ?? 0,
      limit ?? 50,
    );
  }
}

@Controller('billing/invoices')
export class BillingInvoicesController {
  constructor(private readonly invoiceService: InvoiceService) {}

  @Get('')
  async listInvoices(@Request() req: any, @Query('offset') offset?: number, @Query('limit') limit?: number) {
    return this.invoiceService.listInvoices(req.user.workspaceId, offset ?? 0, limit ?? 50);
  }

  @Post('generate')
  @Roles(Role.ADMIN)
  async generateInvoice(@Request() req: any, @Body() body: { subscriptionId?: string; transactionId?: string }) {
    return this.invoiceService.generateInvoice(req.user.workspaceId, body.subscriptionId, body.transactionId);
  }
}