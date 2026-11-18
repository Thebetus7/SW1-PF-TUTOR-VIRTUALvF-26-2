// backend/src/common/services/groq.service.spec.ts
import { ConfigService } from '@nestjs/config';
import { GroqService } from './groq.service';

describe('GroqService (Unit Tests)', () => {
  let groqService: GroqService;
  let mockConfigService: Partial<ConfigService>;

  beforeEach(() => {
    mockConfigService = {
      get: jest.fn().mockImplementation((key: string) => {
        if (key === 'GROQ_API_KEY') return 'mock_test_key_groq_12345';
        if (key === 'GROQ_DEFAULT_MODEL') return 'openai/gpt-oss-120b';
        return undefined;
      }),
    };
    groqService = new GroqService(mockConfigService as ConfigService);
  });

  it('debe inicializarse con el modelo por defecto configurado', () => {
    expect(groqService.getActiveModel()).toBe('openai/gpt-oss-120b');
  });

  it('debe ejecutar el fallbackGenerator si no hay cliente Groq configurado', async () => {
    const unconfiguredConfig: Partial<ConfigService> = {
      get: jest.fn().mockReturnValue(''),
    };
    const unconfiguredService = new GroqService(unconfiguredConfig as ConfigService);

    const fallbackResult = { status: 'fallback_ok' };
    const result = await unconfiguredService.generateJson(
      'Test prompt',
      () => fallbackResult,
    );

    expect(result).toEqual(fallbackResult);
  });

  it('generateText debe retornar el fallback si no hay cliente inicializado', async () => {
    const unconfiguredConfig: Partial<ConfigService> = {
      get: jest.fn().mockReturnValue(''),
    };
    const unconfiguredService = new GroqService(unconfiguredConfig as ConfigService);

    const result = await unconfiguredService.generateText(
      'Test prompt',
      () => 'Texto de contingencia',
    );

    expect(result).toBe('Texto de contingencia');
  });
});
