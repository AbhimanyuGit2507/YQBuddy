import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

interface EvolutionError {
  message: string;
  status?: number;
  raw: string;
}

interface FetchEvoResult {
  status: number;
  data: any;
  error?: EvolutionError;
}

type InstanceState = 'connecting' | 'open' | 'close' | 'unconfigured';

@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);
  private readonly evoUrl =
    process.env.EVOLUTION_API_URL || 'http://localhost:8080';
  private readonly evoApiKey = process.env.EVOLUTION_API_KEY || '';
  private readonly appUrl = process.env.APP_URL || 'http://localhost:3001';

  constructor(
    private prisma: PrismaService,
    private redisService: RedisService,
  ) { }

  private buildEvolutionError(status: number, raw: string): EvolutionError {
    let message = 'Evolution API request failed';
    try {
      const parsed = JSON.parse(raw);
      const apiMessage =
        parsed?.response?.message || parsed?.message || parsed?.error;
      if (Array.isArray(apiMessage)) {
        message = apiMessage.join(', ');
      } else if (typeof apiMessage === 'string' && apiMessage.length > 0) {
        message = apiMessage;
      }
    } catch {
      if (raw.length > 0) message = raw;
    }

    this.logger.error(`Evolution API Error ${status}: ${message}`);
    return { message, status, raw };
  }

  private classifyNetworkError(path: string, error: unknown): EvolutionError {
    const message = error instanceof Error ? error.message : String(error);
    if (
      message.includes('aborted') ||
      message.includes('timeout') ||
      message.includes('ETIMEDOUT')
    ) {
      this.logger.error(`Evolution API timeout: ${path}`);
      return {
        message: `Evolution API request timed out for ${path}`,
        status: 408,
        raw: message,
      };
    }
    if (
      message.includes('ECONNREFUSED') ||
      message.includes('NetworkError') ||
      message.includes('fetch failed')
    ) {
      this.logger.error(`Evolution API unreachable: ${path}`);
      return {
        message:
          'Evolution API is unreachable. Check the service and network connectivity.',
        status: 503,
        raw: message,
      };
    }
    if (message.includes('ENOTFOUND') || message.includes('getaddrinfo')) {
      this.logger.error(`Evolution API DNS failure: ${path}`);
      return {
        message: 'Cannot resolve Evolution API host. Check EVOLUTION_API_URL.',
        status: 503,
        raw: message,
      };
    }
    this.logger.error(`Evolution API network error for ${path}: ${message}`);
    return {
      message: `Evolution API network error for ${path}: ${message}`,
      status: 502,
      raw: message,
    };
  }

  async fetchEvo(
    path: string,
    method: string = 'GET',
    body?: any,
  ): Promise<FetchEvoResult> {
    const startTime = Date.now();
    const fullUrl = `${this.evoUrl}${path}`;

    if (!this.evoUrl) {
      const errorMsg = 'Evolution API URL is not configured.';
      this.logger.warn({
        evoRequest: { method, url: fullUrl, path, body },
        error: errorMsg,
      }, `Evolution API Skipped: ${method} ${path} -> ${errorMsg}`);
      return {
        status: 0,
        data: null,
        error: { message: errorMsg, raw: '' },
      };
    }

    this.logger.log({
      evoRequest: { method, url: fullUrl, path, body: body || null },
    }, `Evolution API Request: ${method} ${path}`);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 35000);

    try {
      const res = await fetch(fullUrl, {
        method,
        headers: {
          'Content-Type': 'application/json',
          apikey: this.evoApiKey,
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      const text = await res.text();
      const durationMs = Date.now() - startTime;
      let parsed: any;
      try {
        parsed = JSON.parse(text);
      } catch {
        parsed = text;
      }

      if (!res.ok) {
        const evolutionError = this.buildEvolutionError(res.status, text);
        this.logger.error({
          evoRequest: { method, url: fullUrl, path, body },
          evoResponse: { status: res.status, raw: text, parsed },
          durationMs,
        }, `Evolution API Failed [Status ${res.status}]: ${method} ${path} (${durationMs}ms) -> ${evolutionError.message}`);
        return { status: res.status, data: parsed, error: evolutionError };
      }

      this.logger.log({
        evoRequest: { method, url: fullUrl, path, body },
        evoResponse: { status: res.status, parsed },
        durationMs,
      }, `Evolution API Response [Status ${res.status}]: ${method} ${path} (${durationMs}ms) -> Success`);
      return { status: res.status, data: parsed };
    } catch (error) {
      const durationMs = Date.now() - startTime;
      const evolutionError = this.classifyNetworkError(path, error);
      this.logger.error({
        evoRequest: { method, url: fullUrl, path, body },
        evolutionError,
        durationMs,
      }, `Evolution API Network/Timeout Error: ${method} ${path} (${durationMs}ms) -> ${evolutionError.message}`);
      return {
        status: evolutionError.status ?? 502,
        data: null,
        error: evolutionError,
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  private extractQr(data: any): string | null {
    if (!data) return null;
    if (typeof data === 'string' && (data.startsWith('data:image') || data.length > 100)) return data;
    if (data?.qrcode?.base64) return data.qrcode.base64;
    if (data?.base64) return data.base64;
    if (data?.instance?.qrcode?.base64) return data.instance.qrcode.base64;
    if (typeof data?.qrcode === 'string') return data.qrcode;
    if (typeof data?.code === 'string' && data.code.startsWith('data:image')) return data.code;
    return null;
  }

  private extractPairingCode(data: any): string | null {
    if (!data) return null;
    if (data?.pairingCode) return data.pairingCode;
    if (data?.instance?.pairingCode) return data.instance.pairingCode;
    return null;
  }

  private findInstanceByName(instances: any[], targetName: string): any {
    if (!Array.isArray(instances) || !targetName) return null;
    return (
      instances.find(
        (inst: any) =>
          inst?.name === targetName ||
          inst?.instanceName === targetName ||
          inst?.instance?.instanceName === targetName ||
          inst?.instance?.name === targetName,
      ) || null
    );
  }

  private extractState(data: any): InstanceState {
    const status =
      data?.instance?.state ||
      data?.instance?.status ||
      data?.instance?.connectionStatus ||
      data?.state ||
      data?.connectionStatus ||
      'close';
    if (status === 'open' || status === 'connected') return 'open';
    if (status === 'connecting') return 'connecting';
    return 'close';
  }

  async setWebhook(instanceName: string) {
    if (!instanceName) {
      this.logger.warn('setWebhook called with empty instanceName');
      return;
    }

    const secretParams = process.env.WEBHOOK_SECRET ? `?secret=${process.env.WEBHOOK_SECRET}` : '';
    const webhookUrl = `${this.appUrl}/whatsapp/webhook/${instanceName}${secretParams}`;
    this.logger.debug(`Setting webhook for ${instanceName} -> ${webhookUrl.split('?')[0]}`);

    const result = await this.fetchEvo(`/webhook/set/${instanceName}`, 'POST', {
      webhook: {
        enabled: true,
        url: webhookUrl,
        webhook_by_events: false,
        webhook_base64: false,
        events: ['MESSAGES_UPSERT', 'CONNECTION_UPDATE'],
      },
    });

    if (result.error) {
      this.logger.warn(
        `Failed to set webhook for ${instanceName}: ${result.error.message}`,
      );
      throw new HttpException(result.error.message, HttpStatus.BAD_GATEWAY);
    }

    this.logger.log(`Webhook set for ${instanceName} -> ${webhookUrl}`);
  }

  private async resolveTenant(targetId?: string) {
    if (!targetId) return null;
    let tenant = await this.prisma.tenant.findUnique({
      where: { id: targetId },
    });
    if (!tenant) {
      const ws = await this.prisma.workspace.findUnique({
        where: { id: targetId },
      });
      if (ws) {
        tenant = await this.prisma.tenant.findUnique({
          where: { id: ws.tenantId },
        });
      }
    }
    if (!tenant) {
      const user = await this.prisma.user.findUnique({
        where: { id: targetId },
        include: { tenant: true },
      });
      if (user?.tenant) {
        tenant = user.tenant;
      }
    }
    return tenant;
  }

  async connect(tenantId: string) {
    const tenant = await this.resolveTenant(tenantId);
    if (!tenant) {
      throw new HttpException('Tenant not found', HttpStatus.NOT_FOUND);
    }

    let instanceName =
      tenant.whatsappInstanceId || `tenant_${tenant.id.substring(0, 8)}`;
    this.logger.log(
      `WhatsApp connect requested for tenant ${tenant.id} -> instance ${instanceName}`,
    );

    const fetchResult = await this.fetchEvo('/instance/fetchInstances', 'GET');
    const existingInstances: any[] = fetchResult.data ?? [];
    const existingInstance = this.findInstanceByName(
      existingInstances,
      instanceName,
    );

    if (!fetchResult.error && existingInstance) {
      const existingState = this.extractState(existingInstance);
      this.logger.log(
        `Instance ${instanceName} already exists in Evolution API with state=${existingState}. Reusing or renewing.`,
      );

      if (existingState === 'open') {
        await this.setWebhook(instanceName).catch((err) =>
          this.logger.warn(`Webhook error: ${err.message}`),
        );
        return {
          instanceName,
          state: 'open' as InstanceState,
        };
      }

      let qr = this.extractQr(existingInstance);
      if (!qr) {
        const connectRes = await this.fetchEvo(
          `/instance/connect/${instanceName}`,
          'GET',
        );
        if (!connectRes.error) {
          qr = this.extractQr(connectRes.data);
        }
      }

      if (qr) {
        await this.setWebhook(instanceName).catch(() => {});
        return {
          instanceName,
          state: 'connecting' as InstanceState,
          qr,
        };
      }

      // If existing instance is stuck in connecting/offline without a valid QR code,
      // generate a fresh instance ID to instantly produce a valid QR code for scanning
      this.logger.warn(
        `Existing instance ${instanceName} yielded no QR code. Creating fresh instance for tenant ${tenant.id}.`,
      );
      this.fetchEvo(`/instance/delete/${instanceName}`, 'DELETE').catch(
        () => {},
      );

      instanceName = `tenant_${Math.random().toString(36).substring(2, 10)}`;
      await this.prisma.tenant.update({
        where: { id: tenant.id },
        data: { whatsappInstanceId: instanceName, whatsappConnected: false },
      });
    } else if (!tenant.whatsappInstanceId) {
      await this.prisma.tenant.update({
        where: { id: tenant.id },
        data: { whatsappInstanceId: instanceName },
      });
    }

    const createResult = await this.fetchEvo('/instance/create', 'POST', {
      instanceName,
      qrcode: true,
      integration: 'WHATSAPP-BAILEYS',
    });

    if (createResult.error) {
      if (createResult.status === 401) {
        this.logger.error(
          `Evolution API auth failed during instance create. Check EVOLUTION_API_KEY.`,
        );
        throw new HttpException(
          'Evolution API authentication failed. Check API key configuration.',
          HttpStatus.BAD_GATEWAY,
        );
      }
      const status =
        createResult.status >= 500
          ? HttpStatus.BAD_GATEWAY
          : HttpStatus.BAD_REQUEST;
      throw new HttpException(createResult.error.message, status);
    }

    try {
      await this.setWebhook(instanceName);
    } catch (webhookError) {
      this.logger.warn(
        `Webhook setup warning for ${instanceName}, continuing...`,
      );
    }

    let qr = this.extractQr(createResult.data);
    let state = this.extractState(createResult.data);

    if (!qr || state === 'close') {
      const connectRes = await this.fetchEvo(
        `/instance/connect/${instanceName}`,
        'GET',
      );
      if (!connectRes.error) {
        qr = this.extractQr(connectRes.data) || qr;
      }
      if (!qr) {
        const stateResult = await this.fetchEvo(
          `/instance/connectionState/${instanceName}`,
          'GET',
        );
        if (!stateResult.error) {
          state = this.extractState(stateResult.data);
          qr = qr || this.extractQr(stateResult.data);
        }
      }
    }

    this.logger.log(
      `WhatsApp connect result for ${instanceName}: state=${state}, qr=${qr ? 'present' : 'missing'}`,
    );

    return {
      instanceName,
      state: state === 'open' ? ('open' as InstanceState) : ('connecting' as InstanceState),
      qr: qr || undefined,
    };
  }

  async generatePairingCode(tenantId: string, phoneNumber: string) {
    if (!phoneNumber) {
      throw new HttpException(
        'Phone number is required for pairing code',
        HttpStatus.BAD_REQUEST,
      );
    }

    const normalizedPhone = phoneNumber.replace(/[\s+-]/g, '');

    const tenant = await this.resolveTenant(tenantId);
    if (!tenant) {
      throw new HttpException('Tenant not found', HttpStatus.NOT_FOUND);
    }

    const instanceName =
      tenant.whatsappInstanceId || `tenant_${tenant.id.substring(0, 8)}`;
    this.logger.log(
      `WhatsApp pairing code requested for tenant ${tenant.id} -> instance ${instanceName}, phone ${normalizedPhone}`,
    );

    if (!tenant.whatsappInstanceId) {
      await this.prisma.tenant.update({
        where: { id: tenant.id },
        data: { whatsappInstanceId: instanceName },
      });
    }

    let createResult: FetchEvoResult;

    const fetchResult = await this.fetchEvo('/instance/fetchInstances', 'GET');
    const existingInstances: any[] = fetchResult.data ?? [];
    const existingInstance = this.findInstanceByName(
      existingInstances,
      instanceName,
    );

    if (!fetchResult.error && existingInstance) {
      const existingState = this.extractState(existingInstance);

      if (existingState === 'open' || existingState === 'connecting') {
        await this.setWebhook(instanceName);
        return {
          instanceName,
          state: existingState,
          pairingCode: null,
          qr: null,
        };
      }

      createResult = await this.fetchEvo(
        `/instance/connect/${instanceName}?number=${normalizedPhone}`,
        'GET',
      );
    } else {
      createResult = await this.fetchEvo('/instance/create', 'POST', {
        instanceName,
        qrcode: true,
        integration: 'WHATSAPP-BAILEYS',
      });
    }

    if (createResult.error) {
      if (
        createResult.status === 409 ||
        createResult.status === 400 ||
        createResult.status === 403
      ) {
        this.logger.warn(
          `Instance ${instanceName} already exists or conflict, attempting connect...`,
        );
        createResult = await this.fetchEvo(
          `/instance/connect/${instanceName}?number=${normalizedPhone}`,
          'GET',
        );
      } else if (createResult.status === 401) {
        this.logger.error(
          `Evolution API auth failed during instance create. Check EVOLUTION_API_KEY.`,
        );
        throw new HttpException(
          'Evolution API authentication failed. Check API key configuration.',
          HttpStatus.BAD_GATEWAY,
        );
      }
    }

    if (createResult.error) {
      const status =
        createResult.status >= 500
          ? HttpStatus.BAD_GATEWAY
          : HttpStatus.BAD_REQUEST;
      throw new HttpException(createResult.error.message, status);
    }

    try {
      await this.setWebhook(instanceName);
    } catch (webhookError) {
      if (
        webhookError instanceof HttpException &&
        webhookError.getStatus() === HttpStatus.BAD_GATEWAY
      ) {
        this.logger.warn(
          `Webhook setup failed for ${instanceName}, but continuing...`,
        );
      }
    }

    const pairingCode = this.extractPairingCode(createResult.data);
    const qr = this.extractQr(createResult.data);

    const stateResult = await this.fetchEvo(
      `/instance/connectionState/${instanceName}`,
      'GET',
    );
    let state: InstanceState = 'connecting';
    if (!stateResult.error) {
      state = this.extractState(stateResult.data);
    }

    this.logger.log(
      `WhatsApp pairing code result for ${instanceName}: state=${state}, pairingCode=${pairingCode ? 'present' : 'missing'}`,
    );

    return {
      instanceName,
      state,
      pairingCode: pairingCode || undefined,
      qr: qr || undefined,
    };
  }

  async disconnect(tenantId: string) {
    const tenant = await this.resolveTenant(tenantId);
    if (!tenant || !tenant.whatsappInstanceId) {
      return { success: true };
    }

    const instanceName = tenant.whatsappInstanceId;

    // Attempt to logout from evolution API
    await this.fetchEvo(`/instance/logout/${instanceName}`, 'DELETE');

    await this.prisma.tenant.update({
      where: { id: tenant.id },
      data: { whatsappConnected: false },
    });

    return { success: true };
  }

  async testMessage(tenantId: string, phone: string, message: string) {
    this.logger.log(`Initiating test message to ${phone} for tenant ${tenantId}`);
    const tenant = await this.resolveTenant(tenantId);
    if (!tenant || !tenant.whatsappInstanceId) {
      this.logger.warn(`Test message failed: WhatsApp not connected for tenant ${tenantId}`);
      throw new HttpException('WhatsApp is not connected', HttpStatus.BAD_REQUEST);
    }
    
    try {
      const result = await this.sendMessage(tenant.whatsappInstanceId, phone, message);
      if (!result.success) {
        this.logger.error(`Test message to ${phone} failed: ${result.error}`);
        throw new HttpException(result.error || 'Failed to send message', HttpStatus.BAD_GATEWAY);
      }
      this.logger.log(`Successfully sent test message to ${phone}`);
      return { success: true };
    } catch (error: any) {
      this.logger.error(`Exception during test message to ${phone}: ${error.message}`);
      throw error instanceof HttpException ? error : new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async status(tenantId: string) {
    const tenant = await this.resolveTenant(tenantId);
    if (!tenant || !tenant.whatsappInstanceId) {
      return { state: 'unconfigured' as InstanceState };
    }

    const instanceName = tenant.whatsappInstanceId;
    const stateResult = await this.fetchEvo(
      `/instance/connectionState/${instanceName}`,
      'GET',
    );

    if (stateResult.error) {
      if (stateResult.status === 404) {
        this.logger.warn(
          `WhatsApp instance ${instanceName} not found in Evolution API. Keeping instance name for reconnection.`,
        );
        await this.prisma.tenant.update({
          where: { id: tenant.id },
          data: { whatsappConnected: false },
        });
        return {
          instanceName,
          state: 'unconfigured' as InstanceState,
          whatsappConnected: false,
        };
      }
      this.logger.error(
        `Failed to get connection state for ${instanceName}: ${stateResult.error.message}`,
      );
      return {
        instanceName,
        state: 'close' as InstanceState,
        whatsappConnected: false,
        error: stateResult.error.message,
      };
    }

    const state = this.extractState(stateResult.data);
    const isConnected = state === 'open';

    let qr: string | null = this.extractQr(stateResult.data);
    if (state === 'close') {
      this.logger.debug(`Instance ${instanceName} is closed. Attempting to connect to generate QR.`);
      const connectRes = await this.fetchEvo(
        `/instance/connect/${instanceName}`,
        'GET',
      );
      if (!connectRes.error) {
        qr = this.extractQr(connectRes.data);
      }
    }

    if (isConnected && !tenant.whatsappConnected) {
      await this.prisma.tenant.update({
        where: { id: tenant.id },
        data: { whatsappConnected: true },
      });
    } else if (!isConnected && tenant.whatsappConnected) {
      await this.prisma.tenant.update({
        where: { id: tenant.id },
        data: { whatsappConnected: false },
      });
    }

    const finalState = isConnected
      ? ('open' as InstanceState)
      : qr
        ? ('connecting' as InstanceState)
        : state;

    let connectedNumber: string | undefined;
    if (isConnected && stateResult.data?.ownerJid) {
      connectedNumber = stateResult.data.ownerJid.split('@')[0];
    } else if (isConnected && stateResult.data?.number) {
      connectedNumber = stateResult.data.number;
    }

    return {
      instanceName,
      state: finalState,
      whatsappConnected: isConnected,
      connectedNumber,
      qr,
    };
  }

  async saveChatbotSettings(tenantId: string, settings: any) {
    const resolvedTenant = await this.resolveTenant(tenantId);
    if (!resolvedTenant) throw new HttpException('Tenant not found', HttpStatus.NOT_FOUND);
    const tenant = await this.prisma.tenant.update({
      where: { id: resolvedTenant.id },
      data: {
        chatbotEnabled: settings.enabled,
        chatbotConfig: settings.config,
      },
    });
    return {
      success: true,
      chatbotEnabled: tenant.chatbotEnabled,
      chatbotConfig: tenant.chatbotConfig,
    };
  }

  async handleWebhook(instanceName: string, payload: any) {
    this.logger.debug(
      `Webhook received for ${instanceName}: event=${payload?.event}`,
    );

    try {
      if (payload?.event === 'connection.update' && payload?.data) {
        const state = payload.data.state;
        if (state === 'close' || state === 'refused') {
          await this.prisma.tenant.updateMany({
            where: { whatsappInstanceId: instanceName },
            data: { whatsappConnected: false }
          });
          this.logger.warn(`WhatsApp disconnected for instance ${instanceName}`);
        } else if (state === 'open') {
          await this.prisma.tenant.updateMany({
            where: { whatsappInstanceId: instanceName },
            data: { whatsappConnected: true }
          });
          this.logger.log(`WhatsApp connected for instance ${instanceName}`);
        }
        return { success: true };
      }

      if (payload?.event !== 'messages.upsert' || !payload?.data) {
        this.logger.debug(
          `Ignoring unsupported webhook event: ${payload?.event}`,
        );
        return { ignored: true };
      }

      const message = payload.data.message;
      const jid = payload.data.key?.remoteJid;
      const fromMe = payload.data.key?.fromMe;
      const messageId = payload.data.key?.id;

      if (fromMe || !jid || jid.includes('@g.us')) {
        this.logger.debug(`Ignoring outgoing or group message from ${jid}`);
        return { ignored: true };
      }

      if (messageId) {
        const isDuplicate = await this.redisService.client.get(`webhook_processed:${messageId}`);
        if (isDuplicate) {
          this.logger.debug(`Ignoring duplicate webhook for messageId ${messageId}`);
          return { ignored: true, reason: 'duplicate' };
        }
        await this.redisService.client.set(`webhook_processed:${messageId}`, '1', 'EX', 86400); // 24 hours
      }

      const phone = jid.split('@')[0];
      if (!phone) {
        this.logger.warn(`Could not extract phone from JID: ${jid}`);
        return { ignored: true };
      }

      let text = '';
      if (message?.conversation) text = message.conversation;
      else if (message?.extendedTextMessage?.text)
        text = message.extendedTextMessage.text;
      else if (message?.buttonsResponseMessage?.selectedButtonId)
        text = message.buttonsResponseMessage.selectedButtonId;
      else if (message?.listResponseMessage?.title)
        text = message.listResponseMessage.title;

      if (!text || !text.trim()) {
        this.logger.debug(`Empty message from ${phone}`);
        return { ignored: true };
      }

      text = text.trim().toUpperCase();
      this.logger.log(
        `Received message from ${phone} on instance ${instanceName}: ${text}`,
      );

      const tenant = await this.prisma.tenant.findFirst({
        where: { whatsappInstanceId: instanceName },
      });

      if (!tenant) {
        this.logger.warn(`No tenant found for instance ${instanceName}`);
        return { ignored: true };
      }

      if (!tenant.chatbotEnabled) {
        this.logger.debug(`Chatbot disabled for tenant ${tenant.id}`);
        return { ignored: true };
      }

      const activeToken = await this.prisma.token.findFirst({
        where: {
          queue: { tenantId: tenant.id },
          phone,
          status: { in: ['WAITING', 'SERVING'] },
        },
        include: { queue: true },
        orderBy: { joinedAt: 'desc' },
      });

      if (!activeToken) {
        const completedToken = await this.prisma.token.findFirst({
          where: {
            queue: { tenantId: tenant.id },
            phone,
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
              thanksRating:
                'Thank you for your rating! Please tell us more about your experience (optional).',
              thanksFeedback: 'Thank you for your feedback!',
            },
            es: {
              thanksRating:
                '¡Gracias por tu calificación! Por favor cuéntanos más sobre tu experiencia (opcional).',
              thanksFeedback: '¡Gracias por tus comentarios!',
            },
            fr: {
              thanksRating:
                'Merci pour votre note ! Veuillez nous en dire plus sur votre expérience (facultatif).',
              thanksFeedback: 'Merci pour vos commentaires !',
            },
          };
          const t = i18n[lang as keyof typeof i18n] || i18n.en;

          if (completedToken.rating === null && /^[1-5]$/.test(text)) {
            await this.prisma.token.update({
              where: { id: completedToken.id },
              data: { rating: parseInt(text) },
            });
            await this.sendMessage(instanceName, jid, t.thanksRating);
            return { handled: true, action: 'rating' };
          } else if (
            completedToken.rating !== null &&
            completedToken.feedbackText === null
          ) {
            await this.prisma.token.update({
              where: { id: completedToken.id },
              data: {
                feedbackText:
                  message?.conversation ||
                  message?.extendedTextMessage?.text ||
                  text,
              },
            });
            await this.sendMessage(instanceName, jid, t.thanksFeedback);
            return { handled: true, action: 'feedback' };
          }
        }

        await this.sendMessage(
          instanceName,
          jid,
          "You don't have any active queues at the moment. Please scan a QR code to join a queue.",
        );
        return { handled: true, action: 'greeting' };
      }

      const config = tenant.chatbotConfig as any;
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
      const t = i18n[lang as keyof typeof i18n] || i18n.en;

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
        return { handled: true, action: 'status' };
      } else if (text === 'CANCEL' || text === t.btnCancel.toUpperCase()) {
        await this.prisma.token.update({
          where: { id: activeToken.id },
          data: { status: 'MISSED' },
        });
        const responseText = config?.templates?.cancel || t.cancel;
        await this.sendMessage(instanceName, jid, responseText);
        return { handled: true, action: 'cancel' };
      } else {
        const newMessage = await this.prisma.message.create({
          data: {
            tokenId: activeToken.id,
            body:
              message?.conversation ||
              message?.extendedTextMessage?.text ||
              text,
            sender: 'CUSTOMER',
          },
        });

        try {
          this.redisService.client.publish(
            'queue_events',
            JSON.stringify({
              type: 'NEW_MESSAGE',
              queueId: activeToken.queueId,
              message: newMessage,
            }),
          );
        } catch (redisError) {
          this.logger.warn(
            `Redis publish failed for queue ${activeToken.queueId}: ${redisError instanceof Error ? redisError.message : redisError}`,
          );
        }

        return { handled: true, action: 'message' };
      }
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : String(e);
      this.logger.error(
        `Error handling webhook for instance ${instanceName}`,
        e,
      );
      return { handled: false, error: errorMessage };
    }
  }

  async sendMessage(instanceName: string, number: string, text: string) {
    if (!instanceName || !number || !text) {
      this.logger.warn(
        `sendMessage called with invalid params: instance=${instanceName}, number=${number}`,
      );
      return { success: false, error: 'Invalid parameters' };
    }

    const normalizedNumber = number.replace(/\D/g, '');
    this.logger.debug(`Sending message on ${instanceName} to normalized number: ${normalizedNumber}`);

    const result = await this.fetchEvo(
      `/message/sendText/${instanceName}`,
      'POST',
      {
        number: normalizedNumber,
        text,
      },
    );

    if (result.error) {
      this.logger.error(
        `Failed to send WhatsApp message to ${normalizedNumber} on ${instanceName}: ${result.error.message}`,
      );
      return { success: false, error: result.error.message };
    }

    this.logger.log(`Sent WhatsApp message to ${normalizedNumber} on ${instanceName}`);
    return { success: true, providerId: result.data?.key?.id };
  }

  async sendButtons(
    instanceName: string,
    number: string,
    text: string,
    footer: string,
    buttons: any[],
  ) {
    if (
      !instanceName ||
      !number ||
      !text ||
      !footer ||
      !Array.isArray(buttons) ||
      buttons.length === 0
    ) {
      this.logger.warn(
        `sendButtons called with invalid params: instance=${instanceName}, number=${number}`,
      );
      return { success: false, error: 'Invalid parameters' };
    }

    const normalizedNumber = number.replace(/\D/g, '');

    const result = await this.fetchEvo(
      `/message/sendButtons/${instanceName}`,
      'POST',
      {
        number: normalizedNumber,
        options: { delay: 0, presence: 'composing' },
        buttonMessage: { text, footer, buttons },
      },
    );

    if (result.error) {
      this.logger.error(
        `Failed to send WhatsApp buttons to ${normalizedNumber} on ${instanceName}: ${result.error.message}`,
      );
      return { success: false, error: result.error.message };
    }

    this.logger.log(`Sent WhatsApp buttons to ${normalizedNumber} on ${instanceName}`);
    return { success: true, providerId: result.data?.key?.id };
  }

  async requestFeedback(tenantId: string, phone: string, language: string) {
    const tenant = await this.resolveTenant(tenantId);
    if (!tenant || !tenant.chatbotEnabled || !tenant.whatsappInstanceId) {
      this.logger.debug(
        `Skipping feedback request for tenant ${tenantId}: not configured`,
      );
      return;
    }

    const lang = language || 'en';
    const i18n = {
      en: 'Thanks for visiting! Please reply with a number from 1 to 5 to rate your experience (5 being excellent).',
      es: '¡Gracias por visitarnos! Por favor responde con un número del 1 al 5 para calificar tu experiencia (5 siendo excelente).',
      fr: 'Merci de votre visite ! Veuillez répondre par un chiffre de 1 à 5 pour évaluer votre expérience (5 étant excellent).',
    };
    const t = i18n[lang as keyof typeof i18n] || i18n.en;

    const result = await this.sendMessage(tenant.whatsappInstanceId, phone, t);
    if (!result.success) {
      this.logger.error(
        `Failed to send feedback request to ${phone} on ${tenant.whatsappInstanceId}: ${result.error}`,
      );
    }
  }

  private generateCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const timestamp = Date.now().toString(36).toUpperCase();
    const randomPart = Array.from({ length: 8 }, () =>
      chars.charAt(Math.floor(Math.random() * chars.length)),
    ).join('');
    return `WVC-${timestamp}-${randomPart}`;
  }

  async generateValidationCode(tenantId: string) {
    const tenant = await this.resolveTenant(tenantId);
    if (!tenant) {
      throw new HttpException('Tenant not found', HttpStatus.NOT_FOUND);
    }

    const code = this.generateCode();
    await this.redisService.client.set(
      `whatsapp:validation-code:${tenantId}`,
      code,
      'EX',
      60,
    );

    this.logger.log(
      `Validation code generated for tenant ${tenantId}: ${code}`,
    );

    return { validationCode: code, expiresIn: 60 };
  }

  async connectWithValidationCode(tenantId: string, validationCode: string) {
    const tenant = await this.resolveTenant(tenantId);
    if (!tenant) {
      throw new HttpException('Tenant not found', HttpStatus.NOT_FOUND);
    }

    const storedCode = await this.redisService.client.get(
      `whatsapp:validation-code:${tenantId}`,
    );
    if (!storedCode || storedCode !== validationCode) {
      throw new HttpException(
        'Invalid or expired validation code',
        HttpStatus.BAD_REQUEST,
      );
    }

    await this.redisService.client.del(`whatsapp:validation-code:${tenantId}`);

    const instanceName =
      tenant.whatsappInstanceId || `tenant_${tenant.id.substring(0, 8)}`;
    this.logger.log(
      `WhatsApp connect with validation code for tenant ${tenant.id} -> instance ${instanceName}`,
    );

    if (!tenant.whatsappInstanceId) {
      await this.prisma.tenant.update({
        where: { id: tenant.id },
        data: { whatsappInstanceId: instanceName },
      });
    }

    let createResult: FetchEvoResult;

    const fetchResult = await this.fetchEvo('/instance/fetchInstances', 'GET');
    const existingInstances: any[] = fetchResult.data ?? [];
    const existingInstance = this.findInstanceByName(
      existingInstances,
      instanceName,
    );

    if (!fetchResult.error && existingInstance) {
      const existingState = this.extractState(existingInstance);
      this.logger.log(
        `Instance ${instanceName} already exists in Evolution API with state=${existingState}. Reusing.`,
      );

      if (existingState === 'open' || existingState === 'connecting') {
        let qr = this.extractQr(existingInstance);
        if (!qr && existingState === 'connecting') {
          const connectRes = await this.fetchEvo(
            `/instance/connect/${instanceName}`,
            'GET',
          );
          if (!connectRes.error) {
            qr = this.extractQr(connectRes.data);
          }
        }
        await this.setWebhook(instanceName);
        return {
          instanceName,
          state: existingState,
          qr: qr || undefined,
        };
      }

      createResult = await this.fetchEvo(
        `/instance/connect/${instanceName}`,
        'GET',
      );
    } else {
      createResult = await this.fetchEvo('/instance/create', 'POST', {
        instanceName,
        qrcode: true,
        integration: 'WHATSAPP-BAILEYS',
      });
    }

    if (createResult.error) {
      if (
        createResult.status === 409 ||
        createResult.status === 400 ||
        createResult.status === 403
      ) {
        this.logger.warn(
          `Instance ${instanceName} already exists or conflict, attempting connect...`,
        );
        createResult = await this.fetchEvo(
          `/instance/connect/${instanceName}`,
          'GET',
        );
      } else if (createResult.status === 401) {
        this.logger.error(
          `Evolution API auth failed during instance create. Check EVOLUTION_API_KEY.`,
        );
        throw new HttpException(
          'Evolution API authentication failed. Check API key configuration.',
          HttpStatus.BAD_GATEWAY,
        );
      }
    }

    if (createResult.error) {
      const status =
        createResult.status >= 500
          ? HttpStatus.BAD_GATEWAY
          : HttpStatus.BAD_REQUEST;
      throw new HttpException(createResult.error.message, status);
    }

    try {
      await this.setWebhook(instanceName);
    } catch (webhookError) {
      if (
        webhookError instanceof HttpException &&
        webhookError.getStatus() === HttpStatus.BAD_GATEWAY
      ) {
        this.logger.warn(
          `Webhook setup failed for ${instanceName}, but continuing...`,
        );
      }
    }

    const stateResult = await this.fetchEvo(
      `/instance/connectionState/${instanceName}`,
      'GET',
    );
    if (stateResult.error) {
      this.logger.error(
        `Failed to fetch connection state for ${instanceName}: ${stateResult.error.message}`,
      );
      throw new HttpException(
        `Failed to check WhatsApp instance state: ${stateResult.error.message}`,
        HttpStatus.BAD_GATEWAY,
      );
    }

    const state = this.extractState(stateResult.data);
    let qr =
      this.extractQr(createResult.data) || this.extractQr(stateResult.data);

    if (state === 'connecting' && !qr) {
      this.logger.warn(
        `Instance ${instanceName} is connecting but QR code is not yet available. Attempting to fetch via connect endpoint.`,
      );
      const connectRes = await this.fetchEvo(
        `/instance/connect/${instanceName}`,
        'GET',
      );
      if (!connectRes.error) {
        qr = this.extractQr(connectRes.data);
      }
    }

    if (
      state === 'close' &&
      createResult.status !== 409 &&
      createResult.status !== 400
    ) {
      this.logger.warn(
        `Instance ${instanceName} returned state=close immediately after connect request.`,
      );
    }

    this.logger.log(
      `WhatsApp connect with validation code result for ${instanceName}: state=${state}, qr=${qr ? 'present' : 'missing'}`,
    );

    return {
      instanceName,
      state,
      qr: qr || undefined,
    };
  }
}
