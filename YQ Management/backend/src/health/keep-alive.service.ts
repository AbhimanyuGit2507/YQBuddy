import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as https from 'https';
import * as http from 'http';
import { SuperAdminService } from '../super-admin/super-admin.service';

@Injectable()
export class KeepAliveService {
  private readonly logger = new Logger(KeepAliveService.name);

  constructor(private readonly superAdminService: SuperAdminService) {}

  // Run every 14 minutes to prevent Render's 15-minute inactivity spin-down
  @Cron('0 */14 * * * *')
  handleCron() {
    const toggles = this.superAdminService.getSystemToggles();

    if (toggles.keepAliveBackend !== false) {
      this.pingBackend();
    } else {
      this.logger.warn('Backend keep-alive ping is DISABLED via Super Admin System Control switch.');
    }

    if (toggles.keepAliveWhatsapp !== false) {
      this.pingWhatsAppEvolutionApi();
    } else {
      this.logger.warn('WhatsApp Evolution keep-alive ping is DISABLED via Super Admin System Control switch.');
    }
  }

  private pingBackend() {
    const backendUrl = process.env.BACKEND_URL;
    if (!backendUrl) {
      this.logger.warn('BACKEND_URL is not defined, skipping keep-alive ping');
      return;
    }

    // Ping our own health endpoint
    const pingUrl = `${backendUrl.replace(/\/$/, '')}/health`;
    this.logger.log(`Pinging ${pingUrl} to keep backend service awake...`);

    const client = pingUrl.startsWith('https') ? https : http;
    
    client.get(pingUrl, (res) => {
      this.logger.log(`Backend keep-alive ping responded with status: ${res.statusCode}`);
    }).on('error', (err) => {
      this.logger.error(`Backend keep-alive ping failed: ${err.message}`);
    });
  }

  private pingWhatsAppEvolutionApi() {
    const evoUrl = process.env.EVOLUTION_API_URL;
    const evoApiKey = process.env.EVOLUTION_API_KEY || '';

    if (!evoUrl) {
      this.logger.debug('EVOLUTION_API_URL is not defined, skipping WhatsApp keep-alive ping');
      return;
    }

    const pingUrl = `${evoUrl.replace(/\/$/, '')}/instance/fetchInstances`;
    this.logger.log(`Pinging ${pingUrl} to keep WhatsApp Evolution API awake...`);

    fetch(pingUrl, {
      headers: { apikey: evoApiKey },
    })
      .then((res) => {
        this.logger.log(`WhatsApp Evolution API keep-alive ping responded with status: ${res.status}`);
      })
      .catch((err) => {
        this.logger.error(`WhatsApp Evolution API keep-alive ping failed: ${err instanceof Error ? err.message : String(err)}`);
      });
  }
}
