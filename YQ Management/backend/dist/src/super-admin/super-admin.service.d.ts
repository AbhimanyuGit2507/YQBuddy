import { PrismaService } from '../prisma/prisma.service';
export declare class SuperAdminService {
    private prisma;
    constructor(prisma: PrismaService);
    getGlobalMetrics(): Promise<{
        totalWorkspaces: number;
        totalRevenue: number;
        totalCustomersServed: number;
        activeQueues: number;
    }>;
    getAllWorkspaces(): Promise<({
        _count: {
            queues: number;
            users: number;
        };
    } & {
        id: string;
        name: string;
        subdomain: string;
        branding: import("@prisma/client/runtime/client").JsonValue | null;
        whatsappInstanceId: string | null;
        whatsappConnected: boolean;
        whatsappPhone: string | null;
        chatbotEnabled: boolean;
        chatbotConfig: import("@prisma/client/runtime/client").JsonValue | null;
        subscriptionStatus: string;
        createdAt: Date;
        updatedAt: Date;
    })[]>;
    getRecentTransactions(): Promise<({
        workspace: {
            name: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.TransactionStatus;
        workspaceId: string;
        paymentProvider: import("@prisma/client").$Enums.PaymentProviderName | null;
        metadata: import("@prisma/client/runtime/client").JsonValue | null;
        amount: number;
        currency: string;
        providerTransactionId: string | null;
        subscriptionId: string | null;
        transactionRef: string;
        internalRef: string;
        rawProviderResponse: import("@prisma/client/runtime/client").JsonValue | null;
    })[]>;
}
