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
var WhatsappService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WhatsappService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const redis_service_1 = require("../redis/redis.service");
let WhatsappService = WhatsappService_1 = class WhatsappService {
    prisma;
    redisService;
    logger = new common_1.Logger(WhatsappService_1.name);
    evoUrl = process.env.EVOLUTION_API_URL || 'http://localhost:8080';
    evoApiKey = process.env.EVOLUTION_API_KEY || '';
    appUrl = process.env.APP_URL || 'http://host.docker.internal:3000';
    constructor(prisma, redisService) {
        this.prisma = prisma;
        this.redisService = redisService;
    }
    async fetchEvo(path, method = 'GET', body, retries = 3) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 30000);
        try {
            const res = await fetch(`${this.evoUrl}${path}`, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    apikey: this.evoApiKey,
                },
                body: body ? JSON.stringify(body) : undefined,
                signal: controller.signal,
            });
            const text = await res.text();
            if (!res.ok) {
                this.logger.error(`Evolution API Error: ${res.status} ${text}`);
            }
            try {
                return { status: res.status, data: JSON.parse(text) };
            }
            catch {
                return { status: res.status, data: text };
            }
        }
        catch (error) {
            if (retries > 1 && (error instanceof Error && error.name === 'AbortError' || error instanceof TypeError)) {
                this.logger.warn(`Evolution API request failed, retrying... (${retries} retries left)`);
                await new Promise(resolve => setTimeout(resolve, 1000 * (4 - retries)));
                return this.fetchEvo(path, method, body, retries - 1);
            }
            throw error;
        }
        finally {
            clearTimeout(timeout);
        }
    }
    async setWebhook(instanceName) {
        const webhookUrl = `${this.appUrl}/whatsapp/webhook/${instanceName}`;
        await this.fetchEvo(`/webhook/set/${instanceName}`, 'POST', {
            url: webhookUrl,
            webhook_by_events: false,
            webhook_base64: false,
            events: ['MESSAGES_UPSERT'],
        });
        this.logger.log(`Webhook set for ${instanceName} -> ${webhookUrl}`);
    }
    async connect(workspaceId) {
        const workspace = await this.prisma.workspace.findUnique({
            where: { id: workspaceId },
        });
        if (!workspace)
            throw new common_1.HttpException('Workspace not found', common_1.HttpStatus.NOT_FOUND);
        const instanceName = workspace.whatsappInstanceId ||
            `workspace_${workspaceId.substring(0, 8)}`;
        if (!workspace.whatsappInstanceId) {
            await this.prisma.workspace.update({
                where: { id: workspaceId },
                data: { whatsappInstanceId: instanceName },
            });
        }
        const cleanupStateRes = await this.fetchEvo(`/instance/connectionState/${instanceName}`, 'GET');
        const cleanupState = cleanupStateRes.data?.instance?.state || 'close';
        if (cleanupState === 'connecting') {
            this.logger.warn(`Instance ${instanceName} stuck in connecting, deleting`);
            await this.fetchEvo(`/instance/delete/${instanceName}`, 'DELETE').catch(() => { });
        }
        const webhookUrl = `${this.appUrl}/whatsapp/webhook/${instanceName}`;
        let connectRes = await this.fetchEvo('/instance/create', 'POST', {
            instanceName,
            qrcode: true,
            integration: 'WHATSAPP-BAILEYS',
            webhook: {
                url: webhookUrl,
                webhook_by_events: false,
                webhook_base64: false,
                events: ['MESSAGES_UPSERT'],
            },
        });
        if (connectRes.status === 403 ||
            connectRes.status === 400 ||
            connectRes.status === 409) {
            connectRes = await this.fetchEvo(`/instance/connect/${instanceName}`, 'GET');
        }
        await this.setWebhook(instanceName);
        const stateRes = await this.fetchEvo(`/instance/connectionState/${instanceName}`, 'GET');
        const state = stateRes.data?.instance?.state || 'close';
        let qr = null;
        if (connectRes.data?.qrcode?.base64) {
            qr = connectRes.data.qrcode.base64;
        }
        else if (connectRes.data?.base64) {
            qr = connectRes.data.base64;
        }
        return {
            instanceName,
            state,
            qr,
        };
    }
    async status(workspaceId) {
        const workspace = await this.prisma.workspace.findUnique({
            where: { id: workspaceId },
        });
        if (!workspace || !workspace.whatsappInstanceId) {
            return { state: 'unconfigured' };
        }
        const stateRes = await this.fetchEvo(`/instance/connectionState/${workspace.whatsappInstanceId}`, 'GET');
        const state = stateRes.data?.instance?.state || 'close';
        if (state === 'open' && !workspace.whatsappConnected) {
            await this.prisma.workspace.update({
                where: { id: workspaceId },
                data: { whatsappConnected: true },
            });
        }
        else if (state !== 'open' && workspace.whatsappConnected) {
            await this.prisma.workspace.update({
                where: { id: workspaceId },
                data: { whatsappConnected: false },
            });
        }
        return {
            instanceName: workspace.whatsappInstanceId,
            state,
            whatsappConnected: state === 'open',
        };
    }
    async saveChatbotSettings(workspaceId, settings) {
        const workspace = await this.prisma.workspace.update({
            where: { id: workspaceId },
            data: {
                chatbotEnabled: settings.enabled,
                chatbotConfig: settings.config,
            },
        });
        return {
            success: true,
            chatbotEnabled: workspace.chatbotEnabled,
            chatbotConfig: workspace.chatbotConfig,
        };
    }
    async handleWebhook(instanceName, payload) {
        try {
            if (payload.event === 'messages.upsert' && payload.data) {
                const message = payload.data.message;
                const jid = payload.data.key.remoteJid;
                const fromMe = payload.data.key.fromMe;
                if (fromMe || !jid || jid.includes('@g.us'))
                    return;
                const phone = jid.split('@')[0];
                let text = '';
                if (message?.conversation)
                    text = message.conversation;
                else if (message?.extendedTextMessage?.text)
                    text = message.extendedTextMessage.text;
                else if (message?.buttonsResponseMessage?.selectedButtonId)
                    text = message.buttonsResponseMessage.selectedButtonId;
                else if (message?.listResponseMessage?.title)
                    text = message.listResponseMessage.title;
                if (!text)
                    return;
                text = text.trim().toUpperCase();
                this.logger.log(`Received message from ${phone} on instance ${instanceName}: ${text}`);
                const workspace = await this.prisma.workspace.findFirst({
                    where: { whatsappInstanceId: instanceName },
                });
                if (!workspace || !workspace.chatbotEnabled)
                    return;
                const activeToken = await this.prisma.token.findFirst({
                    where: {
                        queue: { workspaceId: workspace.id },
                        phone: phone,
                        status: { in: ['WAITING', 'SERVING'] },
                    },
                    include: { queue: true },
                    orderBy: { joinedAt: 'desc' },
                });
                if (!activeToken) {
                    const completedToken = await this.prisma.token.findFirst({
                        where: {
                            queue: { workspaceId: workspace.id },
                            phone: phone,
                            status: 'COMPLETED',
                            completedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
                        },
                        orderBy: { completedAt: 'desc' },
                        include: { queue: true },
                    });
                    if (completedToken) {
                        const lang = completedToken.language || 'en';
                        const i18n = {
                            en: {
                                thanksRating: 'Thank you for your rating! Please tell us more about your experience (optional).',
                                thanksFeedback: 'Thank you for your feedback!',
                            },
                            es: {
                                thanksRating: '¡Gracias por tu calificación! Por favor cuéntanos más sobre tu experiencia (opcional).',
                                thanksFeedback: '¡Gracias por tus comentarios!',
                            },
                            fr: {
                                thanksRating: 'Merci pour votre note ! Veuillez nous en dire plus sur votre expérience (facultatif).',
                                thanksFeedback: 'Merci pour vos commentaires !',
                            },
                        };
                        const t = i18n[lang] || i18n.en;
                        if (completedToken.rating === null && /^[1-5]$/.test(text)) {
                            await this.prisma.token.update({
                                where: { id: completedToken.id },
                                data: { rating: parseInt(text) },
                            });
                            await this.sendMessage(instanceName, jid, t.thanksRating);
                            return;
                        }
                        else if (completedToken.rating !== null &&
                            completedToken.feedbackText === null) {
                            await this.prisma.token.update({
                                where: { id: completedToken.id },
                                data: {
                                    feedbackText: message?.conversation ||
                                        message?.extendedTextMessage?.text ||
                                        text,
                                },
                            });
                            await this.sendMessage(instanceName, jid, t.thanksFeedback);
                            return;
                        }
                    }
                    await this.sendMessage(instanceName, jid, "You don't have any active queues at the moment. Please scan a QR code to join a queue.");
                    return;
                }
                const config = workspace.chatbotConfig;
                const lang = activeToken.language || 'en';
                const i18n = {
                    en: {
                        status: 'You are number {position} in the {queueName} queue.',
                        cancel: 'Your token has been successfully cancelled.',
                        menu: 'Hello! How can we help you today?',
                        btnStatus: 'Check Status',
                        btnCancel: 'Cancel Turn',
                        footer: 'Powered by YQ',
                    },
                    es: {
                        status: 'Eres el número {position} en la fila {queueName}.',
                        cancel: 'Tu turno ha sido cancelado con éxito.',
                        menu: '¡Hola! ¿Cómo podemos ayudarte hoy?',
                        btnStatus: 'Ver Estado',
                        btnCancel: 'Cancelar Turno',
                        footer: 'Desarrollado por YQ',
                    },
                    fr: {
                        status: 'Vous êtes numéro {position} dans la file {queueName}.',
                        cancel: 'Votre ticket a été annulé avec succès.',
                        menu: "Bonjour ! Comment pouvons-nous vous aider aujourd'hui ?",
                        btnStatus: 'Voir le Statut',
                        btnCancel: 'Annuler le Ticket',
                        footer: 'Propulsé par YQ',
                    },
                };
                const t = i18n[lang] || i18n.en;
                if (text === 'STATUS' || text === t.btnStatus.toUpperCase()) {
                    const position = await this.prisma.token.count({
                        where: {
                            queueId: activeToken.queueId,
                            status: 'WAITING',
                            joinedAt: { lt: activeToken.joinedAt },
                        },
                    });
                    let responseText = config?.templates?.status || t.status;
                    responseText = responseText
                        .replace('{position}', (position + 1).toString())
                        .replace('{queueName}', activeToken.queue.name);
                    await this.sendMessage(instanceName, jid, responseText);
                }
                else if (text === 'CANCEL' || text === t.btnCancel.toUpperCase()) {
                    await this.prisma.token.update({
                        where: { id: activeToken.id },
                        data: { status: 'MISSED' },
                    });
                    const responseText = config?.templates?.cancel || t.cancel;
                    await this.sendMessage(instanceName, jid, responseText);
                }
                else {
                    const newMessage = await this.prisma.message.create({
                        data: {
                            tokenId: activeToken.id,
                            body: message?.conversation ||
                                message?.extendedTextMessage?.text ||
                                text,
                            sender: 'CUSTOMER',
                        },
                    });
                    this.redisService.client.publish('queue_events', JSON.stringify({
                        type: 'NEW_MESSAGE',
                        queueId: activeToken.queueId,
                        message: newMessage,
                    }));
                }
            }
        }
        catch (e) {
            this.logger.error('Error handling webhook', e);
        }
    }
    async sendMessage(instanceName, number, text) {
        await this.fetchEvo(`/message/sendText/${instanceName}`, 'POST', {
            number,
            options: {
                delay: 1200,
                presence: 'composing',
            },
            textMessage: {
                text,
            },
        });
    }
    async sendButtons(instanceName, number, text, footer, buttons) {
        await this.fetchEvo(`/message/sendButtons/${instanceName}`, 'POST', {
            number,
            options: {
                delay: 1200,
                presence: 'composing',
            },
            buttonMessage: {
                text,
                footer,
                buttons,
            },
        });
    }
    async requestFeedback(workspaceId, phone, language) {
        const workspace = await this.prisma.workspace.findUnique({
            where: { id: workspaceId },
        });
        if (!workspace ||
            !workspace.chatbotEnabled ||
            !workspace.whatsappInstanceId)
            return;
        const lang = language || 'en';
        const i18n = {
            en: 'Thanks for visiting! Please reply with a number from 1 to 5 to rate your experience (5 being excellent).',
            es: '¡Gracias por visitarnos! Por favor responde con un número del 1 al 5 para calificar tu experiencia (5 siendo excelente).',
            fr: 'Merci de votre visite ! Veuillez répondre par un chiffre de 1 à 5 pour évaluer votre expérience (5 étant excellent).',
        };
        const t = i18n[lang] || i18n.en;
        await this.sendMessage(workspace.whatsappInstanceId, phone, t);
    }
};
exports.WhatsappService = WhatsappService;
exports.WhatsappService = WhatsappService = WhatsappService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        redis_service_1.RedisService])
], WhatsappService);
//# sourceMappingURL=whatsapp.service.js.map