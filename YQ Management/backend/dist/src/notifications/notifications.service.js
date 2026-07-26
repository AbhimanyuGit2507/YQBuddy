"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var NotificationsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsService = void 0;
const common_1 = require("@nestjs/common");
const bullmq_1 = require("@nestjs/bullmq");
const bullmq_2 = require("bullmq");
const communication_log_service_1 = require("../communication/logging/communication-log.service");
let NotificationsService = NotificationsService_1 = class NotificationsService {
    whatsappQueue;
    whatsappProvider;
    communicationLogService;
    logger = new common_1.Logger(NotificationsService_1.name);
    evolutionApiUrl = process.env.EVOLUTION_API_URL;
    evolutionApiKey = process.env.EVOLUTION_API_KEY;
    instanceName = process.env.EVOLUTION_INSTANCE_NAME;
    constructor(whatsappQueue, whatsappProvider, communicationLogService) {
        this.whatsappQueue = whatsappQueue;
        this.whatsappProvider = whatsappProvider;
        this.communicationLogService = communicationLogService;
    }
    async sendWhatsAppMessage(to, body, workspaceId) {
        await this.whatsappQueue.add('sendMessage', { to, body, workspaceId }, {
            attempts: 3,
            backoff: { type: 'exponential', delay: 2000 },
        });
    }
    async executeWhatsAppMessage(job) {
        const { to, body, workspaceId } = job.data;
        try {
            const result = await this.whatsappProvider.sendText(to, body);
            await this.communicationLogService.log({
                channel: communication_log_service_1.CommunicationChannel.WHATSAPP,
                type: 'message',
                recipient: to,
                body,
                status: result.success ? communication_log_service_1.CommunicationStatus.SENT : communication_log_service_1.CommunicationStatus.FAILED,
                provider: 'evolution',
                providerId: result.providerId,
                errorMessage: result.error,
                workspaceId,
            });
            return result;
        }
        catch (error) {
            this.logger.error(`Failed to send WhatsApp message to ${to}`, error);
            return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
    }
    async processWebhookReply(from, body) {
        this.logger.log(`Received reply from ${from}: ${body}`);
        const command = body.trim().toUpperCase();
        if (command === 'LATE') {
            this.logger.log(`[Action] Moving customer ${from} back 2 spots in the queue`);
            await this.sendWhatsAppMessage(from, 'Your turn has been delayed. We will notify you again soon.');
        }
        else if (command === 'CANCEL') {
            this.logger.log(`[Action] Cancelling queue position for ${from}`);
            await this.sendWhatsAppMessage(from, 'You have been removed from the queue.');
        }
        else {
            await this.sendWhatsAppMessage(from, 'Unrecognized command. Reply LATE to delay your turn or CANCEL to leave the queue.');
        }
    }
};
exports.NotificationsService = NotificationsService;
exports.NotificationsService = NotificationsService = NotificationsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, bullmq_1.InjectQueue)('whatsapp')),
    __param(1, (0, common_1.Inject)('WhatsAppProvider')),
    __metadata("design:paramtypes", [bullmq_2.Queue, Object, communication_log_service_1.CommunicationLogService])
], NotificationsService);
//# sourceMappingURL=notifications.service.js.map