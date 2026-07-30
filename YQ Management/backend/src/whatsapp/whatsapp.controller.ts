import {
  Controller,
  Get,
  Post,
  UseGuards,
  Req,
  Body,
  Param,
} from '@nestjs/common';
import { WhatsappService } from './whatsapp.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';
import { WorkspaceGuard } from '../auth/workspace.guard';
import type { AuthenticatedRequest } from '../auth/types/auth.types';

@Controller('whatsapp')
export class WhatsappController {
  constructor(private readonly whatsappService: WhatsappService) {}

  @UseGuards(AuthGuard('jwt'), RolesGuard, WorkspaceGuard)
  @Roles(Role.TENANT_ADMIN)
  @Post('connect')
  connect(@Req() req: AuthenticatedRequest) {
    return this.whatsappService.connect(req.user.tenantId);
  }

  @UseGuards(AuthGuard('jwt'), WorkspaceGuard)
  @Get('status')
  status(@Req() req: AuthenticatedRequest) {
    return this.whatsappService.status(req.user.tenantId);
  }

  @Post('webhook/:instanceName')
  async handleWebhook(
    @Param('instanceName') instanceName: string,
    @Body() body: any,
  ) {
    return this.whatsappService.handleWebhook(instanceName, body);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard, WorkspaceGuard)
  @Roles(Role.TENANT_ADMIN)
  @Post('settings')
  saveChatbotSettings(@Req() req: AuthenticatedRequest, @Body() body: any) {
    return this.whatsappService.saveChatbotSettings(req.user.tenantId, body);
  }
}
