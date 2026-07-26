import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
export declare class WhatsappService {
    private prisma;
    private redisService;
    private readonly logger;
    private readonly evoUrl;
    private readonly evoApiKey;
    private readonly appUrl;
    constructor(prisma: PrismaService, redisService: RedisService);
    fetchEvo(path: string, method?: string, body?: any, retries?: number): Promise<{
        status: number;
        data: any;
    }>;
    setWebhook(instanceName: string): Promise<void>;
    connect(workspaceId: string): Promise<{
        instanceName: string;
        state: any;
        qr: any;
    }>;
    status(workspaceId: string): Promise<{
        state: string;
        instanceName?: undefined;
        whatsappConnected?: undefined;
    } | {
        instanceName: string;
        state: any;
        whatsappConnected: boolean;
    }>;
    saveChatbotSettings(workspaceId: string, settings: any): Promise<{
        success: boolean;
        chatbotEnabled: boolean;
        chatbotConfig: import("@prisma/client/runtime/client").JsonValue;
    }>;
    handleWebhook(instanceName: string, payload: any): Promise<void>;
    sendMessage(instanceName: string, number: string, text: string): Promise<void>;
    sendButtons(instanceName: string, number: string, text: string, footer: string, buttons: any[]): Promise<void>;
    requestFeedback(workspaceId: string, phone: string, language: string): Promise<void>;
}
