import { Queue, Job } from 'bullmq';
import type { WhatsAppProvider } from '../communication/interfaces/whatsapp.provider';
import { CommunicationLogService } from '../communication/logging/communication-log.service';
export declare class NotificationsService {
    private readonly whatsappQueue;
    private readonly whatsappProvider;
    private readonly communicationLogService;
    private readonly logger;
    private readonly evolutionApiUrl;
    private readonly evolutionApiKey;
    private readonly instanceName;
    constructor(whatsappQueue: Queue, whatsappProvider: WhatsAppProvider, communicationLogService: CommunicationLogService);
    sendWhatsAppMessage(to: string, body: string, workspaceId?: string): Promise<void>;
    executeWhatsAppMessage(job: Job<any, any, string>): Promise<import("../communication/interfaces/whatsapp.provider").WhatsAppResult>;
    processWebhookReply(from: string, body: string): Promise<void>;
}
