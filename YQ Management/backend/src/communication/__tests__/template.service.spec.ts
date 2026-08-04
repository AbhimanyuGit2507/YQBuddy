import { Test, TestingModule } from '@nestjs/testing';
import { TemplateService } from '../templates/template.service';

import { PrismaService } from '../../prisma/prisma.service';

describe('TemplateService', () => {
  let service: TemplateService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TemplateService,
        {
          provide: PrismaService,
          useValue: {
            whatsAppTemplate: {
              findFirst: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<TemplateService>(TemplateService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should render email template with variables', () => {
    const result = service.renderEmail('login_otp', { otp: '123456' });
    expect(result.subject).toBe('Your Qmova Login Code');
    expect(result.html).toContain('123456');
    expect(result.text).toContain('123456');
  });

  it('should render WhatsApp template with variables', () => {
    const result = service.renderWhatsApp('otp', { otp: '654321' });
    expect(result).toBe(
      'Your Qmova verification code is 654321. It expires in 5 minutes.',
    );
  });

  it('should return email template keys', () => {
    const keys = service.getEmailTemplateKeys();
    expect(keys).toContain('login_otp');
    expect(keys).toContain('signup_otp');
    expect(keys).toContain('welcome');
  });

  it('should return WhatsApp template keys', () => {
    const keys = service.getWhatsAppTemplateKeys();
    expect(keys).toContain('otp');
    expect(keys).toContain('queue_joined');
    expect(keys).toContain('now_serving');
  });

  it('should fallback for unknown email template', () => {
    const result = service.renderEmail('unknown_template', {});
    expect(result.subject).toBe('Qmova Notification');
  });

  it('should fallback for unknown WhatsApp template', () => {
    const result = service.renderWhatsApp('unknown_template', {});
    expect(result).toBe('');
  });
});
