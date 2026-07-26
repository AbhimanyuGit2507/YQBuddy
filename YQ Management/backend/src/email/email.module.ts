import { Module, Global } from '@nestjs/common';
import { EmailService } from './email.service';
import { CommunicationModule } from '../communication/communication.module';

@Global()
@Module({
  imports: [CommunicationModule],
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}
