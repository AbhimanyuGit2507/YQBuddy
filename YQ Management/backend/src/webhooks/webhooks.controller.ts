import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { WebhooksService } from './webhooks.service';
import { WebhookProcessService } from './webhook-process.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';
import { WorkspaceGuard } from '../auth/workspace.guard';
import { UuidPipe } from '../common/pipes/validation.pipes';

@Controller('webhooks')
@UseGuards(AuthGuard('jwt'), RolesGuard, WorkspaceGuard)
@Roles(Role.ADMIN)
export class WebhooksController {
  constructor(
    private readonly webhooksService: WebhooksService,
    private readonly webhookProcessService: WebhookProcessService,
  ) {}

  @Post()
  async createWebhook(
    @Req() req: any,
    @Body() body: { url: string; secret?: string; events: string[] },
  ) {
    return this.webhooksService.createWebhook(
      req.user.workspaceId,
      body.url,
      body.secret || null,
      body.events,
    );
  }

  @Get()
  async getWebhooks(@Req() req: any) {
    return this.webhooksService.getWebhooks(req.user.workspaceId);
  }

  @Delete(':id')
  async deleteWebhook(@Param('id', UuidPipe) id: string) {
    return this.webhooksService.deleteWebhook(id);
  }

  @Get('events')
  async getWebhookEvents(
    @Req() req: any,
    @Query('offset') offset?: number,
    @Query('limit') limit?: number,
  ) {
    return this.webhookProcessService.getWebhookEvents(
      req.user.workspaceId,
      offset ?? 0,
      limit ?? 50,
    );
  }

  @Get('events/:id')
  async getWebhookEvent(@Param('id', UuidPipe) id: string) {
    return this.webhookProcessService.getWebhookEvent(id);
  }
}