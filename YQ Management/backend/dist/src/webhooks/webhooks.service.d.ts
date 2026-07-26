import { PrismaService } from '../prisma/prisma.service';
import { WebhookUrlValidator } from './webhook-url-validator.service';
export declare class WebhooksService {
    private prisma;
    private readonly urlValidator;
    private readonly logger;
    constructor(prisma: PrismaService, urlValidator: WebhookUrlValidator);
    createWebhook(workspaceId: string, url: string, secret: string | null, events: string[]): Promise<{
        id: string;
        workspaceId: string;
        secret: string | null;
        createdAt: Date;
        url: string;
        events: string[];
        active: boolean;
    }>;
    getWebhooks(workspaceId: string): Promise<{
        id: string;
        workspaceId: string;
        secret: string | null;
        createdAt: Date;
        url: string;
        events: string[];
        active: boolean;
    }[]>;
    deleteWebhook(id: string): Promise<{
        id: string;
        workspaceId: string;
        secret: string | null;
        createdAt: Date;
        url: string;
        events: string[];
        active: boolean;
    }>;
    triggerWebhooks(workspaceId: string, eventName: string, payload: any): Promise<void>;
}
