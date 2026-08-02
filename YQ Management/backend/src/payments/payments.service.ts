import { Injectable, Logger, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  // These should ideally come from ConfigService / Environment variables
  private readonly siteCode = process.env.OZOW_SITE_CODE || '';
  private readonly privateKey = process.env.OZOW_PRIVATE_KEY || '';
  private readonly apiKey = process.env.OZOW_API_KEY || '';
  private readonly baseUrl = process.env.BACKEND_URL || 'http://localhost:3000';
  private readonly frontendUrl =
    process.env.FRONTEND_URL || 'http://localhost:3001';

  constructor(private prisma: PrismaService) {}

  async generatePaymentLink(workspaceId: string) {
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: { tenant: true },
    });

    if (!workspace) {
      throw new InternalServerErrorException('Workspace not found');
    }

    const tenant = workspace.tenant;

    // 1. Create a pending transaction
    const transaction = await this.prisma.transaction.create({
      data: {
        tenantId: tenant.id,
        workspaceId,
        transactionRef: `TXN-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        amount: 299.0,
        currency: 'ZAR',
      },
    });

    // 2. Build the Ozow Payload
    const payload = {
      siteCode: this.siteCode,
      countryCode: 'ZA',
      currencyCode: 'ZAR',
      amount: '299.00',
      transactionReference: transaction.transactionRef,
      bankReference: `QMOVER-${transaction.transactionRef.substring(4, 12)}`,
      cancelUrl: `${this.frontendUrl}/dashboard/settings/billing?status=cancelled`,
      errorUrl: `${this.frontendUrl}/dashboard/settings/billing?status=error`,
      successUrl: `${this.frontendUrl}/dashboard/settings/billing?status=success`,
      notifyUrl: `${this.baseUrl}/payments/webhook`,
      isTest: 'true',
    };

    // 3. Generate SHA512 Hash
    const stringToHash =
      `${payload.siteCode}${payload.countryCode}${payload.currencyCode}${payload.amount}${payload.transactionReference}${payload.bankReference}${payload.cancelUrl}${payload.errorUrl}${payload.successUrl}${payload.notifyUrl}${payload.isTest}${this.privateKey}`.toLowerCase();
    const hashCheck = crypto
      .createHash('sha512')
      .update(stringToHash)
      .digest('hex');

    return {
      ...payload,
      hashCheck,
      paymentUrl: 'https://pay.ozow.com/',
    };
  }

  async handleWebhook(body: any, headers: any) {
    // Note: In production, validate the HashCheck header to ensure it came from Ozow

    const { TransactionReference, Status } = body;

    if (!TransactionReference) {
      throw new BadRequestException('Missing TransactionReference');
    }

    const transaction = await this.prisma.transaction.findUnique({
      where: { transactionRef: TransactionReference },
    });

    if (!transaction) {
      this.logger.error(`Transaction not found: ${TransactionReference}`);
      return { success: false };
    }

    if (transaction.status !== 'PENDING') {
      this.logger.log(`Transaction ${TransactionReference} already processed with status ${transaction.status}`);
      return { success: true };
    }

    const newStatus =
      Status === 'Complete'
        ? 'SUCCESS'
        : Status === 'Cancelled'
          ? 'CANCELLED'
          : 'FAILED';

    await this.prisma.transaction.update({
      where: { id: transaction.id },
      data: { status: newStatus },
    });

    if (newStatus === 'SUCCESS' && transaction.workspaceId) {
      await this.prisma.workspace.update({
        where: { id: transaction.workspaceId },
        data: { subscriptionStatus: 'ACTIVE' },
      });
      this.logger.log(
        `Subscription activated for workspace ${transaction.workspaceId}`,
      );
    }

    return { success: true };
  }

  async createCheckout(dto: any, workspaceId: string) {
    return this.generatePaymentLink(workspaceId);
  }

  async getPaymentStatus(transactionRef: string) {
    const transaction = await this.prisma.transaction.findUnique({
      where: { transactionRef },
    });
    return transaction || { status: 'NOT_FOUND' };
  }

  async getTransactionHistory(workspaceId: string, offset = 0, limit = 20) {
    const transactions = await this.prisma.transaction.findMany({
      where: { workspaceId },
      skip: offset,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });
    const total = await this.prisma.transaction.count({
      where: { workspaceId },
    });
    return { transactions, total, offset, limit };
  }
}
