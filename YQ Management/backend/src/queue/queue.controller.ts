import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { QueueService } from './queue.service';
import { AuthGuard } from '@nestjs/passport';
import { QueueStatus, Role } from '@prisma/client';
import { Permission } from '../permissions/permissions.enum';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RequirePermissions } from '../permissions/permissions.guard';
import { PermissionsGuard } from '../permissions/permissions.guard';
import { WorkspaceGuard } from '../auth/workspace.guard';
import { UuidPipe } from '../common/pipes/validation.pipes';

@Controller('queue')
@UseGuards(AuthGuard('jwt'), WorkspaceGuard)
export class QueueController {
  constructor(private readonly queueService: QueueService) {}

  @Roles(Role.ADMIN)
  @RequirePermissions(Permission.QUEUE_CREATE)
  @Post()
  async createQueue(
    @Req() req: any,
    @Body() body: { name: string; formConfig?: any },
  ) {
    return this.queueService.createQueue(
      req.user.workspaceId,
      body.name,
      body.formConfig,
    );
  }

  @UseGuards(RolesGuard, PermissionsGuard)
  @RequirePermissions(Permission.QUEUE_READ)
  @Get()
  async getQueues(@Req() req: any) {
    return this.queueService.getQueuesForTenant(req.user.workspaceId);
  }

  @UseGuards(RolesGuard, PermissionsGuard)
  @RequirePermissions(Permission.QUEUE_READ)
  @Get('history')
  async getHistory(@Req() req: any) {
    return this.queueService.getHistory(req.user.workspaceId);
  }

  @Get(':id')
  async getQueue(@Param('id', UuidPipe) id: string) {
    return this.queueService.getQueueById(id);
  }

  @Roles(Role.ADMIN)
  @RequirePermissions(Permission.QUEUE_UPDATE)
  @Patch(':id')
  async updateQueue(
    @Param('id', UuidPipe) id: string,
    @Body()
    body: {
      name?: string;
      formConfig?: any;
      nextQueueId?: string | null;
      allowAppointments?: boolean;
      requireManualCheckIn?: boolean;
      appointmentGranularityMins?: number;
    },
  ) {
    return this.queueService.updateQueue(id, body);
  }

  @UseGuards(RolesGuard, PermissionsGuard)
  @RequirePermissions(Permission.QUEUE_READ)
  @Get(':id/tokens')
  async getQueueTokens(@Param('id', UuidPipe) id: string) {
    return this.queueService.getQueueTokens(id);
  }

  @Roles(Role.ADMIN)
  @RequirePermissions(Permission.QUEUE_OPERATE)
  @Patch(':id/status')
  async updateStatus(
    @Param('id', UuidPipe) id: string,
    @Body() body: { status: QueueStatus },
  ) {
    return this.queueService.updateQueueStatus(id, body.status);
  }
}
