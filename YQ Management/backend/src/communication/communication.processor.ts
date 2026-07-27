import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { CommunicationService } from './communication.service';
import { CommunicationEvent } from './events/communication-events.enum';
import { Logger } from '@nestjs/common';

@Processor('communication')
export class CommunicationProcessor extends WorkerHost {
  private readonly logger = new Logger(CommunicationProcessor.name);

  constructor(private readonly communicationService: CommunicationService) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    this.logger.log(
      `Processing communication job ${job.id}: ${job.data.event}`,
    );
    const { event, payload } = job.data;
    await this.communicationService.processEvent(event, payload);
  }
}
