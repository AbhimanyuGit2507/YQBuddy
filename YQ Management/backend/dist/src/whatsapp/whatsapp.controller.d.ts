import { WhatsappService } from './whatsapp.service';
export declare class WhatsappController {
    private readonly whatsappService;
    constructor(whatsappService: WhatsappService);
    connect(req: any): Promise<{
        instanceName: string;
        state: any;
        qr: any;
    }>;
    status(req: any): Promise<{
        state: string;
        instanceName?: undefined;
        whatsappConnected?: undefined;
    } | {
        instanceName: string;
        state: any;
        whatsappConnected: boolean;
    }>;
    handleWebhook(instanceName: string, body: any): Promise<void>;
    saveChatbotSettings(req: any, body: any): Promise<{
        success: boolean;
        chatbotEnabled: boolean;
        chatbotConfig: import("@prisma/client/runtime/client").JsonValue;
    }>;
    testMessage(req: any, body: {
        phone: string;
        message?: string;
    }): Promise<{
        success: boolean;
        error: string;
    } | {
        success: boolean;
        error?: undefined;
    }>;
}
