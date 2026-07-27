import { Injectable, Logger } from '@nestjs/common';
import { WhatsAppProvider } from '../interfaces/whatsapp.provider';

@Injectable()
export class EvolutionProvider implements WhatsAppProvider {
  private readonly logger = new Logger(EvolutionProvider.name);
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly defaultInstance: string;

  constructor() {
    this.baseUrl = process.env.EVOLUTION_API_URL || 'http://localhost:8080';
    this.apiKey = process.env.EVOLUTION_API_KEY || '';
    this.defaultInstance = process.env.EVOLUTION_INSTANCE_NAME || '';
  }

  async fetch(path: string, method: string = 'GET', body?: any) {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        apikey: this.apiKey,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    const text = await res.text();
    if (!res.ok) {
      this.logger.error(`Evolution API Error ${res.status}: ${text}`);
    }
    try {
      return { status: res.status, data: JSON.parse(text) };
    } catch {
      return { status: res.status, data: text };
    }
  }

  async sendText(
    to: string,
    body: string,
  ): Promise<{ success: boolean; providerId?: string; error?: string }> {
    try {
      if (!this.baseUrl || !this.apiKey || !this.defaultInstance) {
        this.logger.warn(`[MOCK WHATSAPP] To: ${to} | Body: ${body}`);
        return { success: true, providerId: 'mock' };
      }

      const cleanNumber = to.replace(/\D/g, '');
      const res = await fetch(
        `${this.baseUrl}/message/sendText/${this.defaultInstance}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: this.apiKey,
          },
          body: JSON.stringify({
            number: cleanNumber,
            text: body,
          }),
        },
      );

      if (!res.ok) {
        const errorText = await res.text();
        this.logger.error(
          `Evolution API error sending message: ${res.status} ${errorText}`,
        );
        return {
          success: false,
          error: `Evolution API error: ${res.status} ${errorText}`,
        };
      }

      const data = await res.json();
      this.logger.log(`Sent WhatsApp message to ${cleanNumber}`);
      return { success: true, providerId: data.key?.id };
    } catch (error) {
      this.logger.error(`Failed to send WhatsApp message to ${to}`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async sendButtons(
    to: string,
    text: string,
    footer: string,
    buttons: Array<{ id: string; text: string }>,
  ): Promise<{ success: boolean; providerId?: string; error?: string }> {
    try {
      if (!this.baseUrl || !this.apiKey || !this.defaultInstance) {
        this.logger.warn(`[MOCK WHATSAPP] Buttons to: ${to} | Text: ${text}`);
        return { success: true, providerId: 'mock' };
      }

      const cleanNumber = to.replace(/\D/g, '');
      const res = await fetch(
        `${this.baseUrl}/message/sendButtons/${this.defaultInstance}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: this.apiKey,
          },
          body: JSON.stringify({
            number: cleanNumber,
            options: { delay: 1200, presence: 'composing' },
            buttonMessage: { text, footer, buttons },
          }),
        },
      );

      if (!res.ok) {
        const errorText = await res.text();
        this.logger.error(
          `Evolution API error sending buttons: ${res.status} ${errorText}`,
        );
        return {
          success: false,
          error: `Evolution API error: ${res.status} ${errorText}`,
        };
      }

      const data = await res.json();
      this.logger.log(`Sent WhatsApp buttons to ${cleanNumber}`);
      return { success: true, providerId: data.key?.id };
    } catch (error) {
      this.logger.error(`Failed to send WhatsApp buttons to ${to}`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async connect(
    workspaceId: string,
  ): Promise<{ instanceName: string; state: string; qr?: string }> {
    if (!this.baseUrl || !this.apiKey || !this.defaultInstance) {
      return {
        instanceName: `workspace_${workspaceId.substring(0, 8)}`,
        state: 'close',
      };
    }

    const instanceName = `workspace_${workspaceId.substring(0, 8)}`;
    let connectRes = await this.fetch('/instance/create', 'POST', {
      instanceName,
      qrcode: true,
      integration: 'WHATSAPP-BAILEYS',
    });

    if (
      connectRes.status === 403 ||
      connectRes.status === 400 ||
      connectRes.status === 409
    ) {
      connectRes = await this.fetch(`/instance/connect/${instanceName}`, 'GET');
    }

    const stateRes = await this.fetch(
      `/instance/connectionState/${instanceName}`,
      'GET',
    );
    const state = stateRes.data?.instance?.state || 'close';

    let qr: string | undefined;
    if (connectRes.data?.qrcode?.base64) {
      qr = connectRes.data.qrcode.base64;
    } else if (connectRes.data?.base64) {
      qr = connectRes.data.base64;
    }

    return { instanceName, state, qr };
  }

  async status(instanceName: string): Promise<{ state: string }> {
    if (!this.baseUrl || !this.apiKey || !this.defaultInstance) {
      return { state: 'close' };
    }

    const stateRes = await this.fetch(
      `/instance/connectionState/${instanceName}`,
      'GET',
    );
    return { state: stateRes.data?.instance?.state || 'close' };
  }

  async disconnect(instanceName: string): Promise<void> {
    if (!this.baseUrl || !this.apiKey || !this.defaultInstance) {
      return;
    }

    await this.fetch(`/instance/logout/${instanceName}`, 'DELETE');
  }
}
