import { PrismaService } from '../prisma/prisma.service';
import { BillingConfigService } from '../billing/config/billing-config.service';
import { ProviderRegistry } from '../billing/providers/provider-registry.service';
import { CreatePaymentDto } from './dto/payment.dto';
export declare class PaymentsService {
    private readonly prisma;
    private readonly configService;
    private readonly providerRegistry;
    private readonly logger;
    constructor(prisma: PrismaService, configService: BillingConfigService, providerRegistry: ProviderRegistry);
    createCheckout(dto: CreatePaymentDto, workspaceId: string): Promise<import("../billing/interfaces/payment-provider.interface").CheckoutResult>;
    getPaymentStatus(transactionRef: string): Promise<{
        id: string;
        transactionRef: string;
        internalRef: string;
        amount: number;
        currency: string;
        status: import("@prisma/client").$Enums.TransactionStatus;
        paymentProvider: import("@prisma/client").$Enums.PaymentProviderName | null;
        providerTransactionId: string | null;
        workspaceId: string;
        workspace: {
            name: string;
        };
        createdAt: Date;
        updatedAt: Date;
    }>;
    getTransactionHistory(workspaceId: string, offset?: number, limit?: number): Promise<{
        id: string;
        createdAt: Date;
        workspaceId: string;
        status: import("@prisma/client").$Enums.TransactionStatus;
        paymentProvider: import("@prisma/client").$Enums.PaymentProviderName | null;
        updatedAt: Date;
        providerTransactionId: string | null;
        subscriptionId: string | null;
        amount: number;
        currency: string;
        transactionRef: string;
        internalRef: string;
        rawProviderResponse: import("@prisma/client/runtime/client").JsonValue | null;
        metadata: import("@prisma/client/runtime/client").JsonValue | null;
    }[]>;
    getTransactionById(id: string): Promise<{
        id: string;
        createdAt: Date;
        workspaceId: string;
        status: import("@prisma/client").$Enums.TransactionStatus;
        paymentProvider: import("@prisma/client").$Enums.PaymentProviderName | null;
        updatedAt: Date;
        providerTransactionId: string | null;
        subscriptionId: string | null;
        amount: number;
        currency: string;
        transactionRef: string;
        internalRef: string;
        rawProviderResponse: import("@prisma/client/runtime/client").JsonValue | null;
        metadata: import("@prisma/client/runtime/client").JsonValue | null;
    }>;
}
