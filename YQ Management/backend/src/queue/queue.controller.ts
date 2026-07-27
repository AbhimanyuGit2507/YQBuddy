import { Controller, Post, Get, Patch, Body, Param, UseGuards, Req } from '@nestjs/common';
import { QueueService } from './queue.service';
import { AuthGuard } from '@nestjs/passport';
import { QueueStatus, Role } from '@prisma/client';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('queue')
export class QueueController {
  constructor(private readonly queueService: QueueService) {}

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.TENANT_ADMIN)
  @Post()
  async createQueue(@Req() req: any, @Body() body: { name: string, formConfig?: any }) {
    return this.queueService.createQueue(req.user.tenantId, body.name, body.formConfig);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get()
  async getQueues(@Req() req: any) {
    return this.queueService.getQueuesForTenant(req.user.tenantId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('history')
  async getHistory(@Req() req: any) {
    return this.queueService.getHistory(req.user.tenantId);
  }

  @Get(':id')
  async getQueue(@Param('id') id: string) {
    return this.queueService.getQueueById(id);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.TENANT_ADMIN)
  @Patch(':id')
  async updateQueue(@Param('id') id: string, @Body() body: { name?: string, formConfig?: any, nextQueueId?: string | null, allowAppointments?: boolean, requireManualCheckIn?: boolean, appointmentGranularityMins?: number }) {
    return this.queueService.updateQueue(id, body);
  }



  @UseGuards(AuthGuard('jwt'))
  @Get(':id/tokens')
  async getQueueTokens(@Param('id') id: string) {
    return this.queueService.getQueueTokens(id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch(':id/status')
  async updateStatus(@Param('id') id: string, @Body() body: { status: QueueStatus }) {
    return this.queueService.updateQueueStatus(id, body.status);
  }
}

