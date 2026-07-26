import { Test, TestingModule } from '@nestjs/testing';
import { BrevoProvider } from '../providers/brevo.provider';

describe('BrevoProvider', () => {
  let provider: BrevoProvider;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BrevoProvider],
    }).compile();

    provider = module.get<BrevoProvider>(BrevoProvider);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });

  it('should mock send when no API key', async () => {
    const result = await provider.send({
      to: 'test@example.com',
      subject: 'Test',
      htmlContent: '<p>Test</p>',
    });

    expect(result.success).toBe(true);
    expect(result.providerId).toBe('mock');
  });

  it('should return false for testConnection when no API key', async () => {
    const result = await provider.testConnection();
    expect(result).toBe(false);
  });
});
