import {
  Controller,
  Get,
  Post,
  UseGuards,
  Req,
  Body,
  Param,
  UnauthorizedException,
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
  @Roles(Role.TENANT_ADMIN, Role.SUPER_ADMIN, Role.ADMIN)
  @Post('connect')
  connect(@Req() req: AuthenticatedRequest) {
    return this.whatsappService.connect(req.user.tenantId);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard, WorkspaceGuard)
  @Roles(Role.TENANT_ADMIN, Role.SUPER_ADMIN, Role.ADMIN)
  @Post('generate-validation-code')
  async generateValidationCode(@Req() req: AuthenticatedRequest) {
    return this.whatsappService.generateValidationCode(req.user.tenantId);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard, WorkspaceGuard)
  @Roles(Role.TENANT_ADMIN, Role.SUPER_ADMIN, Role.ADMIN)
  @Post('pairing-code')
  async generatePairingCode(
    @Req() req: AuthenticatedRequest,
    @Body() body: { phoneNumber: string },
  ) {
    return this.whatsappService.generatePairingCode(
      req.user.tenantId,
      body.phoneNumber,
    );
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard, WorkspaceGuard)
  @Roles(Role.TENANT_ADMIN, Role.SUPER_ADMIN, Role.ADMIN)
  @Post('connect-with-code')
  connectWithCode(
    @Req() req: AuthenticatedRequest,
    @Body() body: { validationCode: string },
  ) {
    return this.whatsappService.connectWithValidationCode(
      req.user.tenantId,
      body.validationCode,
    );
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard, WorkspaceGuard)
  @Roles(Role.TENANT_ADMIN, Role.SUPER_ADMIN, Role.ADMIN)
  @Post('disconnect')
  disconnect(@Req() req: AuthenticatedRequest) {
    return this.whatsappService.disconnect(req.user.tenantId);
  }

  @UseGuards(AuthGuard('jwt'), WorkspaceGuard)
  @Get('status')
  status(@Req() req: AuthenticatedRequest) {
    return this.whatsappService.status(req.user.tenantId);
  }

  @Post('webhook/:instanceName')
  async handleWebhook(
    @Param('instanceName') instanceName: string,
    @Req() req: any,
    @Body() body: any,
  ) {
    const secret = req.query.secret;
    const expectedSecret = process.env.WEBHOOK_SECRET;
    
    if (expectedSecret && secret !== expectedSecret) {
      throw new UnauthorizedException('Invalid webhook secret');
    }
    
    return this.whatsappService.handleWebhook(instanceName, body);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard, WorkspaceGuard)
  @Roles(Role.TENANT_ADMIN, Role.SUPER_ADMIN, Role.ADMIN)
  @Post('settings')
  saveChatbotSettings(@Req() req: AuthenticatedRequest, @Body() body: any) {
    return this.whatsappService.saveChatbotSettings(req.user.tenantId, body);
  }
}
