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

@Controller('billing/payments')
@UseGuards(AuthGuard('jwt'), RolesGuard, WorkspaceGuard)
@Roles(Role.ADMIN, Role.OPERATOR)
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly webhookProcessService: WebhookProcessService,
  ) {}

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

  @Get('transaction/:id')
  async getTransaction(@Param('id', UuidPipe) id: string) {
    return this.paymentsService.getTransactionById(id);
  }

  @Post('webhooks/ozow')
  @HttpCode(HttpStatus.OK)
  async handleOzowWebhook(@Body() body: any, @Request() req: any) {
    return this.webhookProcessService.processPaymentWebhook(body, req.headers);
  }
}