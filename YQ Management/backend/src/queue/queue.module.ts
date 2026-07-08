import { Module } from '@nestjs/common';
import { QueueService } from './queue.service';
import { QueueController } from './queue.controller';
import { QueueGateway } from './queue.gateway';

@Module({
  providers: [QueueService, QueueGateway],
  controllers: [QueueController]
})
export class QueueModule {}
