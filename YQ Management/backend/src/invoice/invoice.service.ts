import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class InvoiceService {
  private readonly logger = new Logger(InvoiceService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getInvoice(invoiceId: string) {
    return this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { workspace: { select: { name: true } }, subscription: true },
    });
  }

  async listInvoices(workspaceId: string, offset = 0, limit = 50) {
    return this.prisma.invoice.findMany({
      where: { workspaceId },
      skip: offset,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });
  }

  async generateInvoice(workspaceId: string, subscriptionId?: string, transactionId?: string) {
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: { name: true, subdomain: true },
    });

    if (!workspace) {
      throw new Error('Workspace not found');
    }

    const invoiceNumber = `INV-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    let amount = 0;
    let currency = 'ZAR';

    if (transactionId) {
      const transaction = await this.prisma.transaction.findUnique({
        where: { id: transactionId },
      });
      if (transaction) {
        amount = transaction.amount;
        currency = transaction.currency;
      }
    }

    const invoice = await this.prisma.invoice.create({
      data: {
        workspaceId,
        subscriptionId,
        transactionId,
        invoiceNumber,
        amount,
        currency,
        status: 'DRAFT',
      },
    });

    this.logger.log(`Invoice generated: ${invoiceNumber} for workspace ${workspaceId}`);
    return invoice;
  }
}