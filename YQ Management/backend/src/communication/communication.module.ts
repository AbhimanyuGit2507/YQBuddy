import { Module, Global } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { PrismaModule } from '../prisma/prisma.module';
import { CommunicationService } from './communication.service';
import { TemplateService } from './templates/template.service';
import { CommunicationLogService } from './logging/communication-log.service';
import { BrevoProvider } from './providers/brevo.provider';
import { EvolutionProvider } from './providers/evolution.provider';
import { CommunicationProcessor } from './communication.processor';
import { CommunicationController } from './communication.controller';
import { WhatsAppTemplateService } from './templates/whatsapp-template.service';

@Global()
@Module({
  imports: [
    PrismaModule,
    BullModule.registerQueue({
      name: 'communication',
    }),
  ],
  providers: [
    CommunicationService,
    TemplateService,
    CommunicationLogService,
    WhatsAppTemplateService,
    BrevoProvider,
    EvolutionProvider,
    CommunicationProcessor,
    {
      provide: 'EmailProvider',
      useClass: BrevoProvider,
    },
    {
      provide: 'WhatsAppProvider',
      useClass: EvolutionProvider,
    },
  ],
  controllers: [CommunicationController],
  exports: [CommunicationService, TemplateService, CommunicationLogService, WhatsAppTemplateService, 'EmailProvider', 'WhatsAppProvider'],
})
export class CommunicationModule {}
