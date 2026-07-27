import { Test, TestingModule } from '@nestjs/testing';
import { EvolutionProvider } from '../providers/evolution.provider';

describe('EvolutionProvider', () => {
  let provider: EvolutionProvider;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EvolutionProvider],
    }).compile();

    provider = module.get<EvolutionProvider>(EvolutionProvider);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });

  it('should mock sendText when no API config', async () => {
    const result = await provider.sendText('27821234567', 'Test message');
    expect(result.success).toBe(true);
    expect(result.providerId).toBe('mock');
  });

  it('should mock sendButtons when no API config', async () => {
    const result = await provider.sendButtons('27821234567', 'Test', 'Footer', [
      { id: '1', text: 'OK' },
    ]);
    expect(result.success).toBe(true);
    expect(result.providerId).toBe('mock');
  });

  it('should return default status when no API config', async () => {
    const result = await provider.status('test-instance');
    expect(result.state).toBe('close');
  });
});
