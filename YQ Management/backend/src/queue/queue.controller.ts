import { Controller, Post, Get, Patch, Body, Param, UseGuards, Req } from '@nestjs/common';
import { QueueService } from './queue.service';
import { AuthGuard } from '@nestjs/passport';
import { QueueStatus } from '@prisma/client';

@UseGuards(AuthGuard('jwt'))
@Controller('queue')
export class QueueController {
  constructor(private readonly queueService: QueueService) {}

  @Post()
  async createQueue(@Req() req: any, @Body() body: { name: string }) {
    // Assuming the JWT payload has tenantId
    return this.queueService.createQueue(req.user.tenantId, body.name);
  }

  @Get()
  async getQueues(@Req() req: any) {
    return this.queueService.getQueuesForTenant(req.user.tenantId);
  }

  @Patch(':id/status')
  async updateStatus(@Param('id') id: string, @Body() body: { status: QueueStatus }) {
    return this.queueService.updateQueueStatus(id, body.status);
  }
}

