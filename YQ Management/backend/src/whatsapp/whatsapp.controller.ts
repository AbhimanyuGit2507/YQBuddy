import {
  Controller,
  Get,
  Post,
  UseGuards,
  Request,
  Body,
  Param,
  Header,
} from '@nestjs/common';
import { WhatsappService } from './whatsapp.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';
import { WorkspaceGuard } from '../auth/workspace.guard';
import { ConfigService } from '@nestjs/config';
import { EvolutionApiKeyGuard } from '../auth/evolution-api-key.guard';

@Controller('whatsapp')
export class WhatsappController {
  constructor(private readonly whatsappService: WhatsappService) {}

  @UseGuards(AuthGuard('jwt'), RolesGuard, WorkspaceGuard)
  @Roles(Role.ADMIN)
  @Post('connect')
  connect(@Request() req: any) {
    return this.whatsappService.connect(req.user.workspaceId);
  }

  @UseGuards(AuthGuard('jwt'), WorkspaceGuard)
  @Get('status')
  status(@Request() req: any) {
    return this.whatsappService.status(req.user.workspaceId);
  }

  @UseGuards(EvolutionApiKeyGuard)
  @Post('webhook/:instanceName')
  async handleWebhook(
    @Param('instanceName') instanceName: string,
    @Body() body: any,
  ) {
    return this.whatsappService.handleWebhook(instanceName, body);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard, WorkspaceGuard)
  @Roles(Role.ADMIN)
  @Post('settings')
  saveChatbotSettings(@Request() req: any, @Body() body: any) {
    return this.whatsappService.saveChatbotSettings(req.user.workspaceId, body);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard, WorkspaceGuard)
  @Roles(Role.ADMIN)
  @Post('test-message')
  async testMessage(@Request() req: any, @Body() body: { phone: string; message?: string }) {
    const workspace = await this.whatsappService['prisma'].workspace.findUnique({
      where: { id: req.user.workspaceId },
    });

    if (!workspace?.whatsappInstanceId) {
      return { success: false, error: 'WhatsApp not connected' };
    }

    await this.whatsappService.sendMessage(
      workspace.whatsappInstanceId,
      body.phone,
      body.message || 'Test message from QMover',
    );

    return { success: true };
  }
}
