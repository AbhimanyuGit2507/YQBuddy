"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var NotificationsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsService = void 0;
const common_1 = require("@nestjs/common");
let NotificationsService = NotificationsService_1 = class NotificationsService {
    logger = new common_1.Logger(NotificationsService_1.name);
    evolutionApiUrl = process.env.EVOLUTION_API_URL;
    evolutionApiKey = process.env.EVOLUTION_API_KEY;
    instanceName = process.env.EVOLUTION_INSTANCE_NAME;
    async sendWhatsAppMessage(to, body) {
        try {
            if (this.evolutionApiUrl && this.evolutionApiKey && this.instanceName) {
                const cleanNumber = to.replace(/\D/g, '');
                const res = await fetch(`${this.evolutionApiUrl}/message/sendText/${this.instanceName}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'apikey': this.evolutionApiKey
                    },
                    body: JSON.stringify({
                        number: cleanNumber,
                        text: body
                    })
                });
                if (!res.ok) {
                    throw new Error(`Evolution API error: ${res.status} ${res.statusText}`);
                }
                this.logger.log(`Sent real WhatsApp message to ${cleanNumber} via Evolution API`);
            }
            else {
                this.logger.warn(`[MOCK WHATSAPP] To: ${to} | Body: ${body}`);
            }
        }
        catch (error) {
            this.logger.error(`Failed to send WhatsApp message to ${to}`, error);
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
    (0, common_1.Injectable)()
], NotificationsService);
//# sourceMappingURL=notifications.service.js.map