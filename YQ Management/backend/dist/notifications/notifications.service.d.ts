export declare class NotificationsService {
    private readonly logger;
    private readonly evolutionApiUrl;
    private readonly evolutionApiKey;
    private readonly instanceName;
    sendWhatsAppMessage(to: string, body: string): Promise<void>;
    processWebhookReply(from: string, body: string): Promise<void>;
}
