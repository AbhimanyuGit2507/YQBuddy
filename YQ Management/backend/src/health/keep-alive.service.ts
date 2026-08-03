import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as https from 'https';
import * as http from 'http';

@Injectable()
export class KeepAliveService {
  private readonly logger = new Logger(KeepAliveService.name);

  // Run every 14 minutes to prevent Render's 15-minute inactivity spin-down
  @Cron('0 */14 * * * *')
  handleCron() {
    const backendUrl = process.env.BACKEND_URL;
    if (!backendUrl) {
      this.logger.warn('BACKEND_URL is not defined, skipping keep-alive ping');
      return;
    }

    // Ping our own health endpoint
    const pingUrl = `${backendUrl.replace(/\/$/, '')}/health`;
    this.logger.log(`Pinging ${pingUrl} to keep service awake...`);

    const client = pingUrl.startsWith('https') ? https : http;
    
    client.get(pingUrl, (res) => {
      this.logger.log(`Keep-alive ping responded with status: ${res.statusCode}`);
    }).on('error', (err) => {
      this.logger.error(`Keep-alive ping failed: ${err.message}`);
    });
  }
}
