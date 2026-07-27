import { Controller, Get, Post, UseGuards, Request, Body, Param } from '@nestjs/common';
import { WhatsappService } from './whatsapp.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

@Controller('whatsapp')
export class WhatsappController {
  constructor(private readonly whatsappService: WhatsappService) {}

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.TENANT_ADMIN)
  @Post('connect')
  connect(@Request() req: any) {
    return this.whatsappService.connect(req.user.tenantId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('status')
  status(@Request() req: any) {
    return this.whatsappService.status(req.user.tenantId);
  }

  @Post('webhook/:instanceName')
  async handleWebhook(@Param('instanceName') instanceName: string, @Body() body: any) {
    return this.whatsappService.handleWebhook(instanceName, body);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.TENANT_ADMIN)
  @Post('settings')
  saveChatbotSettings(@Request() req: any, @Body() body: any) {
    return this.whatsappService.saveChatbotSettings(req.user.tenantId, body);
  }
}
