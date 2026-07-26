import { Module } from '@nestjs/common';
import { InvoiceService } from './invoice.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [InvoiceService],
  exports: [InvoiceService],
})
export class InvoiceModule {}