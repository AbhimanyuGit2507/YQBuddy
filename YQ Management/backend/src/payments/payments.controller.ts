import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Request,
  Query,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';
import { CreatePaymentDto } from './dto/payment.dto';
import { WebhookProcessService } from '../webhooks/webhook-process.service';
import { WorkspaceGuard } from '../auth/workspace.guard';
import { UuidPipe } from '../common/pipes/validation.pipes';
import { PrismaService } from '../prisma/prisma.service';
import type { AuthenticatedRequest } from '../auth/types/auth.types';

@Controller('billing/payments')
@UseGuards(AuthGuard('jwt'), RolesGuard, WorkspaceGuard)
@Roles(Role.ADMIN, Role.OPERATOR)
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly webhookProcessService: WebhookProcessService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('checkout')
  async createCheckout(
    @Request() req: AuthenticatedRequest,
    @Body() dto: CreatePaymentDto,
  ) {
    return this.paymentsService.createCheckout(dto, req.user.workspaceId);
  }

  @Post('generate-link')
  async generateLink(
    @Request() req: AuthenticatedRequest,
    @Body() body: { planId?: string },
  ) {
    const planId = body.planId;
    if (!planId) {
      const plan = await this.prisma.plan.findFirst({
        where: { status: 'ACTIVE' },
      });
      if (!plan) {
        throw new BadRequestException(
          'No active plan available for subscription',
        );
      }
      return this.paymentsService.createCheckout(
        { planId: plan.id },
        req.user.workspaceId,
      );
    }
    return this.paymentsService.createCheckout(
      { planId },
      req.user.workspaceId,
    );
  }

  @Get('status/:transactionRef')
  async getPaymentStatus(@Param('transactionRef') transactionRef: string) {
    return this.paymentsService.getPaymentStatus(transactionRef);
  }

  @Get('history')
  async getTransactionHistory(
    @Request() req: AuthenticatedRequest,
    @Query('offset') offset?: number,
    @Query('limit') limit?: number,
  ) {
    return this.paymentsService.getTransactionHistory(
      req.user.workspaceId,
      offset ?? 0,
      limit ?? 50,
    );
  }

  @Get('transaction/:id')
  async getTransaction(@Param('id', UuidPipe) id: string) {
    return this.paymentsService.getTransactionById(id);
  }

  @Post('webhooks/ozow')
  @HttpCode(HttpStatus.OK)
  async handleOzowWebhook(
    @Body() body: any,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.webhookProcessService.processPaymentWebhook(body, req.headers);
  }
}
