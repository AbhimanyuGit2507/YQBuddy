import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);
  private readonly evoUrl = process.env.EVOLUTION_API_URL || 'http://localhost:8080';
  private readonly evoApiKey = process.env.EVOLUTION_API_KEY || 'yq_secret_evolution_key_123';
  private readonly appUrl = process.env.APP_URL || 'http://host.docker.internal:3000';

  constructor(private prisma: PrismaService, private redisService: RedisService) {}

  async fetchEvo(path: string, method: string = 'GET', body?: any) {
    const res = await fetch(`${this.evoUrl}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'apikey': this.evoApiKey
      },
      body: body ? JSON.stringify(body) : undefined
    });
    const text = await res.text();
    if (!res.ok) {
      this.logger.error(`Evolution API Error: ${res.status} ${text}`);
    }
    try {
      return { status: res.status, data: JSON.parse(text) };
    } catch {
      return { status: res.status, data: text };
    }
  }

  async setWebhook(instanceName: string) {
    const webhookUrl = `${this.appUrl}/whatsapp/webhook/${instanceName}`;
    await this.fetchEvo(`/webhook/set/${instanceName}`, 'POST', {
      url: webhookUrl,
      webhook_by_events: false,
      webhook_base64: false,
      events: [
        "MESSAGES_UPSERT"
      ]
    });
    this.logger.log(`Webhook set for ${instanceName} -> ${webhookUrl}`);
  }

  async connect(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId }});
    if (!tenant) throw new HttpException('Tenant not found', HttpStatus.NOT_FOUND);

    const instanceName = tenant.whatsappInstanceId || `tenant_${tenantId.substring(0, 8)}`;
    
    if (!tenant.whatsappInstanceId) {
      await this.prisma.tenant.update({
        where: { id: tenantId },
        data: { whatsappInstanceId: instanceName }
      });
    }

    let connectRes = await this.fetchEvo('/instance/create', 'POST', {
      instanceName,
      qrcode: true,
      integration: "WHATSAPP-BAILEYS"
    });

    if (connectRes.status === 403 || connectRes.status === 400 || connectRes.status === 409) {
      connectRes = await this.fetchEvo(`/instance/connect/${instanceName}`, 'GET');
    }
    
    this.setWebhook(instanceName).catch(() => {});
    
    const stateRes = await this.fetchEvo(`/instance/connectionState/${instanceName}`, 'GET');
    const state = stateRes.data?.instance?.state || 'close';
    
    let qr = null;
    if (connectRes.data?.qrcode?.base64) {
      qr = connectRes.data.qrcode.base64;
    } else if (connectRes.data?.base64) {
      qr = connectRes.data.base64;
    } else if (stateRes.data?.instance?.qrcode?.base64) {
      qr = stateRes.data.instance.qrcode.base64;
    } else if (stateRes.data?.qrcode?.base64) {
      qr = stateRes.data.qrcode.base64;
    }

    this.logger.log(
      `WhatsApp connect result for ${instanceName}: state=${state}, qr=${qr ? 'present' : 'missing'}`,
    );

    if (!qr && state === 'connecting') {
      this.logger.warn(
        `QR code not returned for ${instanceName} in state=${state}, check Evolution API logs`,
      );
    }

    return {
      instanceName,
      state,
      qr,
    };
  }

  async status(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId }});
    if (!tenant || !tenant.whatsappInstanceId) {
      return { state: 'unconfigured' };
    }

    const stateRes = await this.fetchEvo(`/instance/connectionState/${tenant.whatsappInstanceId}`, 'GET');
    const state = stateRes.data?.instance?.state || 'close';

    if (state === 'open' && !tenant.whatsappConnected) {
      await this.prisma.tenant.update({
        where: { id: tenantId },
        data: { whatsappConnected: true }
      });
    } else if (state !== 'open' && tenant.whatsappConnected) {
      await this.prisma.tenant.update({
        where: { id: tenantId },
        data: { whatsappConnected: false }
      });
    }

    return {
      instanceName: tenant.whatsappInstanceId,
      state,
      whatsappConnected: state === 'open',
      qr: stateRes.data?.instance?.qrcode?.base64 || stateRes.data?.qrcode?.base64 || null,
    };
  }

  async saveChatbotSettings(tenantId: string, settings: any) {
    const tenant = await this.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        chatbotEnabled: settings.enabled,
        chatbotConfig: settings.config,
      }
    });
    return { success: true, chatbotEnabled: tenant.chatbotEnabled, chatbotConfig: tenant.chatbotConfig };
  }

  async handleWebhook(instanceName: string, payload: any) {
    // The payload format from Evolution API for MESSAGES_UPSERT
    try {
      if (payload.event === 'messages.upsert' && payload.data) {
        const message = payload.data.message;
        const jid = payload.data.key.remoteJid;
        const fromMe = payload.data.key.fromMe;

        if (fromMe || !jid || jid.includes('@g.us')) return; // Ignore outgoing and groups
        
        // Extract phone number from JID (e.g. 5511999999999@s.whatsapp.net -> 5511999999999)
        const phone = jid.split('@')[0];
        
        // Extract text
        let text = '';
        if (message?.conversation) text = message.conversation;
        else if (message?.extendedTextMessage?.text) text = message.extendedTextMessage.text;
        else if (message?.buttonsResponseMessage?.selectedButtonId) text = message.buttonsResponseMessage.selectedButtonId;
        else if (message?.listResponseMessage?.title) text = message.listResponseMessage.title;

        if (!text) return;

        text = text.trim().toUpperCase();
        this.logger.log(`Received message from ${phone} on instance ${instanceName}: ${text}`);

        // Find tenant by instanceName
        const tenant = await this.prisma.tenant.findFirst({
          where: { whatsappInstanceId: instanceName }
        });

        if (!tenant || !tenant.chatbotEnabled) return; // Chatbot disabled

        // Custom chatbot logic based on tenant.chatbotConfig
        // Find if they have an active token
        const activeToken = await this.prisma.token.findFirst({
          where: {
            queue: { tenantId: tenant.id },
            phone: phone, // Assuming phone was saved exactly as JID format
            status: { in: ['WAITING', 'SERVING'] } // Only respond to active tokens
          },
          include: { queue: true },
          orderBy: { joinedAt: 'desc' }
        });

        if (!activeToken) {
          // Check for recently COMPLETED token missing feedback
          const completedToken = await this.prisma.token.findFirst({
            where: {
              queue: { tenantId: tenant.id },
              phone: phone,
              status: 'COMPLETED',
              completedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
            },
            orderBy: { completedAt: 'desc' },
            include: { queue: true }
          });

          if (completedToken) {
            const lang = completedToken.language || 'en';
            const i18n = {
              en: { thanksRating: "Thank you for your rating! Please tell us more about your experience (optional).", thanksFeedback: "Thank you for your feedback!" },
              es: { thanksRating: "¡Gracias por tu calificación! Por favor cuéntanos más sobre tu experiencia (opcional).", thanksFeedback: "¡Gracias por tus comentarios!" },
              fr: { thanksRating: "Merci pour votre note ! Veuillez nous en dire plus sur votre expérience (facultatif).", thanksFeedback: "Merci pour vos commentaires !" }
            };
            const t = i18n[lang as keyof typeof i18n] || i18n.en;

            if (completedToken.rating === null && /^[1-5]$/.test(text)) {
              await this.prisma.token.update({
                where: { id: completedToken.id },
                data: { rating: parseInt(text) }
              });
              await this.sendMessage(instanceName, jid, t.thanksRating);
              return;
            } else if (completedToken.rating !== null && completedToken.feedbackText === null) {
              await this.prisma.token.update({
                where: { id: completedToken.id },
                data: { feedbackText: message?.conversation || message?.extendedTextMessage?.text || text }
              });
              await this.sendMessage(instanceName, jid, t.thanksFeedback);
              return;
            }
          }

          // If no active token and no pending feedback, maybe send a generic greeting or ignore
          await this.sendMessage(instanceName, jid, "You don't have any active queues at the moment. Please scan a QR code to join a queue.");
          return;
        }

        const config = tenant.chatbotConfig as any;
        const lang = activeToken.language || 'en';
        
        const i18n = {
          en: { status: "You are number {position} in the {queueName} queue.", cancel: "Your token has been successfully cancelled.", menu: "Hello! How can we help you today?", btnStatus: "Check Status", btnCancel: "Cancel Turn", footer: "Powered by YQ" },
          es: { status: "Eres el número {position} en la fila {queueName}.", cancel: "Tu turno ha sido cancelado con éxito.", menu: "¡Hola! ¿Cómo podemos ayudarte hoy?", btnStatus: "Ver Estado", btnCancel: "Cancelar Turno", footer: "Desarrollado por YQ" },
          fr: { status: "Vous êtes numéro {position} dans la file {queueName}.", cancel: "Votre ticket a été annulé avec succès.", menu: "Bonjour ! Comment pouvons-nous vous aider aujourd'hui ?", btnStatus: "Voir le Statut", btnCancel: "Annuler le Ticket", footer: "Propulsé par YQ" }
        };

        const t = i18n[lang as keyof typeof i18n] || i18n.en;
        
        if (text === 'STATUS' || text === t.btnStatus.toUpperCase()) {
          // Calculate position
          const position = await this.prisma.token.count({
            where: {
              queueId: activeToken.queueId,
              status: 'WAITING',
              joinedAt: { lt: activeToken.joinedAt }
            }
          });
          
          let responseText = config?.templates?.status || t.status;
          responseText = responseText.replace('{position}', (position + 1).toString()).replace('{queueName}', activeToken.queue.name);
          
          await this.sendMessage(instanceName, jid, responseText);
        } 
        else if (text === 'CANCEL' || text === t.btnCancel.toUpperCase()) {
          await this.prisma.token.update({
            where: { id: activeToken.id },
            data: { status: 'MISSED' }
          });
          
          let responseText = config?.templates?.cancel || t.cancel;
          await this.sendMessage(instanceName, jid, responseText);
        }
        else {
          // Normal chat message from customer
          const newMessage = await this.prisma.message.create({
            data: {
              tokenId: activeToken.id,
              body: message?.conversation || message?.extendedTextMessage?.text || text,
              sender: 'CUSTOMER'
            }
          });

          // Broadcast to dashboard
          this.redisService.client.publish('queue_events', JSON.stringify({ 
            type: 'NEW_MESSAGE', 
            queueId: activeToken.queueId, 
            message: newMessage 
          }));
        }
      }
    } catch (e) {
      this.logger.error('Error handling webhook', e);
    }
  }

  async sendMessage(instanceName: string, number: string, text: string) {
    await this.fetchEvo(`/message/sendText/${instanceName}`, 'POST', {
      number,
      options: {
        delay: 1200,
        presence: "composing"
      },
      textMessage: {
        text
      }
    });
  }

  async sendButtons(instanceName: string, number: string, text: string, footer: string, buttons: any[]) {
    await this.fetchEvo(`/message/sendButtons/${instanceName}`, 'POST', {
      number,
      options: {
        delay: 1200,
        presence: "composing"
      },
      buttonMessage: {
        text,
        footer,
        buttons
      }
    });
  }

  async requestFeedback(tenantId: string, phone: string, language: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant || !tenant.chatbotEnabled || !tenant.whatsappInstanceId) return;

    const lang = language || 'en';
    const i18n = {
      en: "Thanks for visiting! Please reply with a number from 1 to 5 to rate your experience (5 being excellent).",
      es: "¡Gracias por visitarnos! Por favor responde con un número del 1 al 5 para calificar tu experiencia (5 siendo excelente).",
      fr: "Merci de votre visite ! Veuillez répondre par un chiffre de 1 à 5 pour évaluer votre expérience (5 étant excellent)."
    };
    const t = i18n[lang as keyof typeof i18n] || i18n.en;
    
    // Evolution API expects standard numbers, or JIDs if needed. sendMessage accepts `number`
    // Wait, sendMessage expects exactly what fetchEvo expects for `number`.
    // In our `sendMessage` wrapper, we just pass `number`.
    await this.sendMessage(tenant.whatsappInstanceId, phone, t);
  }
}
