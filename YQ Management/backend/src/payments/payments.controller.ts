import {
  Controller,
  Post,
  Body,
  Headers,
  UseGuards,
  Request,
  Get,
  Req,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.TENANT_ADMIN)
  @Get('generate-link')
  async generatePaymentLink(@Req() req: any) {
    const workspaceId = req.user.workspaceId;
    return this.paymentsService.generatePaymentLink(workspaceId);
  }

  @Post('webhook')
  async handleWebhook(@Body() body: any, @Headers() headers: any) {
    return this.paymentsService.handleWebhook(body, headers);
  }
}
