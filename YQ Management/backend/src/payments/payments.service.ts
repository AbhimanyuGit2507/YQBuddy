import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BillingConfigService } from '../billing/config/billing-config.service';
import { ProviderRegistry } from '../billing/providers/provider-registry.service';
import { PaymentProviderName } from '@prisma/client';
import { TransactionStatus } from '@prisma/client';
import { CreateCheckoutInput } from '../billing/interfaces/payment-provider.interface';
import { CreatePaymentDto } from './dto/payment.dto';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: BillingConfigService,
    private readonly providerRegistry: ProviderRegistry,
  ) {}

  async createCheckout(dto: CreatePaymentDto, workspaceId: string) {
    const plan = await this.prisma.plan.findUnique({
      where: { id: dto.planId },
    });

    if (!plan) {
      throw new NotFoundException(`Plan with id ${dto.planId} not found`);
    }

    if (plan.status !== 'ACTIVE') {
      throw new BadRequestException(`Plan ${plan.name} is not active`);
    }

    const amount = dto.amount ?? plan.price;
    const currency = dto.currency || plan.currency || 'ZAR';
    const billingInterval =
      dto.billingInterval || plan.billingInterval || 'MONTHLY';

    if (dto.amount !== undefined && dto.amount !== plan.price) {
      throw new BadRequestException(
        `Amount ${dto.amount} does not match plan price ${plan.price}`,
      );
    }

    if (dto.currency && dto.currency !== plan.currency) {
      throw new BadRequestException(
        `Currency ${dto.currency} does not match plan currency ${plan.currency}`,
      );
    }

    if (dto.billingInterval && dto.billingInterval !== plan.billingInterval) {
      throw new BadRequestException(
        `Billing interval ${dto.billingInterval} does not match plan interval ${plan.billingInterval}`,
      );
    }

    const provider = this.providerRegistry.getProvider(
      PaymentProviderName.OZOW,
    );

    const checkoutInput: CreateCheckoutInput = {
      workspaceId,
      subscriptionId: '',
      planId: dto.planId,
      amount,
      currency,
      billingInterval,
      returnUrl: `${this.configService.getFrontendUrl()}/dashboard/settings/billing?status=success`,
      cancelUrl: `${this.configService.getFrontendUrl()}/dashboard/settings/billing?status=cancelled`,
      notifyUrl: `${this.configService.getBackendUrl()}/billing/payments/webhooks/ozow`,
    };

    const result = await provider.createCheckout(checkoutInput);

    await this.prisma.transaction.create({
      data: {
        workspaceId,
        transactionRef: result.providerTransactionId,
        internalRef: result.paymentReference,
        amount,
        currency,
        status: TransactionStatus.PENDING,
        providerTransactionId: result.providerTransactionId,
        paymentProvider: PaymentProviderName.OZOW,
      },
    });

    return result;
  }

  async getPaymentStatus(transactionRef: string) {
    const transaction = await this.prisma.transaction.findUnique({
      where: { transactionRef },
      include: { workspace: { select: { name: true } } },
    });

    if (!transaction) {
      throw new NotFoundException(`Transaction ${transactionRef} not found`);
    }

    return {
      id: transaction.id,
      transactionRef: transaction.transactionRef,
      internalRef: transaction.internalRef,
      amount: transaction.amount,
      currency: transaction.currency,
      status: transaction.status,
      paymentProvider: transaction.paymentProvider,
      providerTransactionId: transaction.providerTransactionId,
      workspaceId: transaction.workspaceId,
      workspace: transaction.workspace,
      createdAt: transaction.createdAt,
      updatedAt: transaction.updatedAt,
    };
  }

  async getTransactionHistory(workspaceId: string, offset = 0, limit = 50) {
    return this.prisma.transaction.findMany({
      where: { workspaceId },
      skip: offset,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });
  }

  async getTransactionById(id: string) {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id },
    });
    if (!transaction) {
      throw new NotFoundException(`Transaction ${id} not found`);
    }
    return transaction;
  }
}
