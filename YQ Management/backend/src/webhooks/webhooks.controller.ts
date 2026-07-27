import { Controller, Post, Get, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { WebhooksService } from './webhooks.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

@Controller('webhooks')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(Role.TENANT_ADMIN)
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Post()
  async createWebhook(@Req() req: any, @Body() body: { url: string, secret?: string, events: string[] }) {
    return this.webhooksService.createWebhook(req.user.tenantId, body.url, body.secret || null, body.events);
  }

  @Get()
  async getWebhooks(@Req() req: any) {
    return this.webhooksService.getWebhooks(req.user.tenantId);
  }

  @Delete(':id')
  async deleteWebhook(@Param('id') id: string) {
    return this.webhooksService.deleteWebhook(id);
  }
}
