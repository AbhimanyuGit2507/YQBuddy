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
var WebhooksService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhooksService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const webhook_url_validator_service_1 = require("./webhook-url-validator.service");
let WebhooksService = WebhooksService_1 = class WebhooksService {
    prisma;
    urlValidator;
    logger = new common_1.Logger(WebhooksService_1.name);
    constructor(prisma, urlValidator) {
        this.prisma = prisma;
        this.urlValidator = urlValidator;
    }
    async createWebhook(workspaceId, url, secret, events) {
        await this.urlValidator.validate(url);
        return this.prisma.webhookEndpoint.create({
            data: { workspaceId, url, secret, events },
        });
    }
    async getWebhooks(workspaceId) {
        return this.prisma.webhookEndpoint.findMany({ where: { workspaceId } });
    }
    async deleteWebhook(id) {
        return this.prisma.webhookEndpoint.delete({ where: { id } });
    }
    async triggerWebhooks(workspaceId, eventName, payload) {
        const endpoints = await this.prisma.webhookEndpoint.findMany({
            where: {
                workspaceId,
                active: true,
                events: { has: eventName },
            },
        });
        for (const endpoint of endpoints) {
            try {
                const controller = new AbortController();
                const timeout = setTimeout(() => controller.abort(), 10000);
                await fetch(endpoint.url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-yq-event': eventName,
                    },
                    body: JSON.stringify({
                        event: eventName,
                        data: payload,
                        timestamp: new Date(),
                    }),
                    signal: controller.signal,
                });
                clearTimeout(timeout);
                this.logger.log(`Triggered webhook ${eventName} for workspace ${workspaceId} at ${endpoint.url}`);
            }
            catch (error) {
                this.logger.error(`Failed to trigger webhook ${endpoint.url}`, error);
            }
        }
    }
};
exports.WebhooksService = WebhooksService;
exports.WebhooksService = WebhooksService = WebhooksService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, webhook_url_validator_service_1.WebhookUrlValidator])
], WebhooksService);
//# sourceMappingURL=webhooks.service.js.map