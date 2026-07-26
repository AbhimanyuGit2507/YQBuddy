import { Injectable, BadRequestException } from '@nestjs/common';
import * as dns from 'dns';
import * as net from 'net';

@Injectable()
export class WebhookUrlValidator {
  private readonly blockedHosts = new Set([
    'localhost',
    '127.0.0.1',
    '0.0.0.0',
    '::1',
    '169.254.169.254',
    'metadata.google.internal',
    '10.0.0.0',
    '10.255.255.255',
    '172.16.0.0',
    '172.31.255.255',
    '192.168.0.0',
    '192.168.255.255',
  ]);

  async validate(url: string): Promise<void> {
    if (!url || typeof url !== 'string') {
      throw new BadRequestException('Invalid webhook URL');
    }

    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      throw new BadRequestException('Invalid webhook URL format');
    }

    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      throw new BadRequestException('Webhook URL must use HTTP or HTTPS');
    }

    if (parsed.protocol === 'http:') {
      const hostname = parsed.hostname.toLowerCase();
      if (
        !hostname.includes('localhost') &&
        !hostname.startsWith('127.') &&
        !hostname.startsWith('192.168.') &&
        !hostname.startsWith('10.') &&
        !hostname.startsWith('172.16.') &&
        !hostname.startsWith('172.17.') &&
        !hostname.startsWith('172.18.') &&
        !hostname.startsWith('172.19.') &&
        !hostname.startsWith('172.20.') &&
        !hostname.startsWith('172.21.') &&
        !hostname.startsWith('172.22.') &&
        !hostname.startsWith('172.23.') &&
        !hostname.startsWith('172.24.') &&
        !hostname.startsWith('172.25.') &&
        !hostname.startsWith('172.26.') &&
        !hostname.startsWith('172.27.') &&
        !hostname.startsWith('172.28.') &&
        !hostname.startsWith('172.29.') &&
        !hostname.startsWith('172.30.') &&
        !hostname.startsWith('172.31.') &&
        hostname !== '0.0.0.0' &&
        hostname !== '::1'
      ) {
        throw new BadRequestException('Insecure webhook URL: use HTTPS for external URLs');
      }
    }

    for (const blocked of this.blockedHosts) {
      if (parsed.hostname.toLowerCase() === blocked) {
        throw new BadRequestException('Webhook URL points to a blocked internal address');
      }
    }

    if (parsed.hostname.toLowerCase().endsWith('.internal')) {
      throw new BadRequestException('Webhook URL points to an internal address');
    }

    try {
      const resolved = await this.resolveIp(parsed.hostname);
      if (this.isPrivateIp(resolved)) {
        throw new BadRequestException('Webhook URL resolves to a private/internal IP address');
      }
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
    }
  }

  private resolveIp(hostname: string): Promise<string> {
    return new Promise((resolve, reject) => {
      dns.lookup(hostname, (err, address) => {
        if (err) {
          reject(err);
        } else {
          resolve(address);
        }
      });
    });
  }

  private isPrivateIp(ip: string): boolean {
    const privateRanges = [
      { start: '10.0.0.0', end: '10.255.255.255' },
      { start: '172.16.0.0', end: '172.31.255.255' },
      { start: '192.168.0.0', end: '192.168.255.255' },
      { start: '169.254.0.0', end: '169.254.255.255' },
      { start: '127.0.0.0', end: '127.255.255.255' },
    ];

    const ipNum = this.ipToNumber(ip);
    for (const range of privateRanges) {
      const start = this.ipToNumber(range.start);
      const end = this.ipToNumber(range.end);
      if (ipNum >= start && ipNum <= end) {
        return true;
      }
    }
    return false;
  }

  private ipToNumber(ip: string): number {
    const parts = ip.split('.').map(Number);
    return (parts[0] << 24) + (parts[1] << 16) + (parts[2] << 8) + parts[3];
  }
}
