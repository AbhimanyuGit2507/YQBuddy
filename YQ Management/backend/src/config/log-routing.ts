import pino from 'pino';
import build from 'pino-abstract-transport';
import pretty from 'pino-pretty';
import { createWriteStream, mkdirSync } from 'fs';
import { join } from 'path';

const logDir = join(process.cwd(), 'logs');

mkdirSync(logDir, { recursive: true });

const serviceMap: Record<string, string> = {
  AuthController: 'auth',
  AuthService: 'auth',
  BrevoProvider: 'auth',
  PasswordResetService: 'auth',
  WhatsappService: 'whatsapp',
  WhatsappProcessor: 'whatsapp',
  EvolutionProvider: 'whatsapp',
  PaymentsService: 'payments',
  PaymentsController: 'payments',
  BillingConfigService: 'payments',
  OzowProvider: 'payments',
  WebhooksService: 'webhooks',
  WebhookProcessService: 'webhooks',
  NotificationsService: 'webhooks',
  NotificationsController: 'webhooks',
  QueueGateway: 'queue',
  CommunicationProcessor: 'queue',
  CommunicationService: 'queue',
  CommunicationLogService: 'queue',
  TemplateService: 'queue',
  RedisService: 'infra',
  RateLimitService: 'infra',
  EmailService: 'infra',
  AuditService: 'infra',
  AllExceptionsFilter: 'infra',
};

function getServiceName(context: string): string {
  for (const [pattern, name] of Object.entries(serviceMap)) {
    if (context.includes(pattern)) {
      return name;
    }
  }
  return 'backend';
}

const fileStreams: Record<string, ReturnType<typeof createWriteStream>> = {};

function getFileStream(name: string): ReturnType<typeof createWriteStream> {
  if (!fileStreams[name]) {
    fileStreams[name] = createWriteStream(join(logDir, `${name}.log`), {
      flags: 'a',
    });
  }
  return fileStreams[name];
}

export default function createLogRoutingTransport(): pino.MultiStreamRes {
  const routingStream = build(function (stream) {
    stream.on('data', (log: Record<string, unknown>) => {
      const context = typeof log.context === 'string' ? log.context : '';
      const serviceName = getServiceName(context);
      const dest = getFileStream(serviceName);
      dest.write(JSON.stringify(log) + '\n');
    });
  });

  const prettyStream = pretty({ singleLine: true });

  return pino.multistream([
    { stream: routingStream, level: 'info' },
    { stream: prettyStream, level: 'info' },
  ]);
}
