import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/payment.dto';
import { WebhookProcessService } from '../webhooks/webhook-process.service';
export declare class PaymentsController {
    private readonly paymentsService;
    private readonly webhookProcessService;
    constructor(paymentsService: PaymentsService, webhookProcessService: WebhookProcessService);
    createCheckout(req: any, dto: CreatePaymentDto): Promise<import("../billing/interfaces/payment-provider.interface").CheckoutResult>;
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
    getTransactionHistory(req: any, offset?: number, limit?: number): Promise<{
        id: string;
        status: import("@prisma/client").$Enums.TransactionStatus;
        workspaceId: string;
        createdAt: Date;
        subscriptionId: string | null;
        updatedAt: Date;
        metadata: import("@prisma/client/runtime/client").JsonValue | null;
        transactionRef: string;
        internalRef: string;
        amount: number;
        currency: string;
        providerTransactionId: string | null;
        paymentProvider: import("@prisma/client").$Enums.PaymentProviderName | null;
        rawProviderResponse: import("@prisma/client/runtime/client").JsonValue | null;
    }[]>;
    getTransaction(id: string): Promise<{
        id: string;
        status: import("@prisma/client").$Enums.TransactionStatus;
        workspaceId: string;
        createdAt: Date;
        subscriptionId: string | null;
        updatedAt: Date;
        metadata: import("@prisma/client/runtime/client").JsonValue | null;
        transactionRef: string;
        internalRef: string;
        amount: number;
        currency: string;
        providerTransactionId: string | null;
        paymentProvider: import("@prisma/client").$Enums.PaymentProviderName | null;
        rawProviderResponse: import("@prisma/client/runtime/client").JsonValue | null;
    }>;
    handleOzowWebhook(body: any, req: any): Promise<{
        success: boolean;
    }>;
}
