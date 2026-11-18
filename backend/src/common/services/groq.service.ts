// backend/src/common/services/groq.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Groq from 'groq-sdk';

@Injectable()
export class GroqService {
  private readonly logger = new Logger(GroqService.name);
  private groqClient: Groq | null = null;

  // Cascada de modelos de inferencia ultra-rápida de Groq Cloud
  private readonly fallbackModels: string[];

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('GROQ_API_KEY');
    const defaultModel =
      this.configService.get<string>('GROQ_DEFAULT_MODEL') || 'openai/gpt-oss-120b';

    // Lista ordenada en cascada sin duplicados
    this.fallbackModels = Array.from(
      new Set([defaultModel, 'openai/gpt-oss-20b', 'qwen/qwen3.8-27b']),
    );

    if (apiKey && apiKey.trim().length > 0 && apiKey !== 'demo_key') {
      try {
        this.groqClient = new Groq({ apiKey });
        this.logger.log('Cliente Groq Cloud inicializado exitosamente.');
      } catch (err) {
        this.logger.error(`Error al inicializar cliente Groq: ${err instanceof Error ? err.message : err}`);
      }
    } else {
      this.logger.warn(
        'GROQ_API_KEY no configurada o es clave demo; se activará el Fallback Heurístico Determinista por defecto.',
      );
    }
  }

  /**
   * Genera contenido estructurado en JSON garantizado mediante Groq Cloud.
   * Utiliza response_format { type: 'json_object' }, timeout preventivo y rotación en cascada.
   */
  async generateJson<T>(prompt: string, fallbackGenerator: () => T): Promise<T> {
    if (!this.groqClient) {
      this.logger.debug('Sin cliente Groq activo, ejecutando fallback determinista');
      return fallbackGenerator();
    }

    const deadline = Date.now() + 10000;
    for (const modelName of this.fallbackModels) {
      const remaining = deadline - Date.now();
      if (remaining < 500) break;
      try {
        this.logger.log(`Intentando inferencia Groq Cloud con modelo: ${modelName}`);

        const completion = await this.groqClient.chat.completions.create(
          {
            model: modelName,
            messages: [
              {
                role: 'system',
                content:
                  'Eres un asistente pedagógico de IA preciso. Responde SIEMPRE en formato JSON válido y conforme al esquema solicitado.',
              },
              {
                role: 'user',
                content: prompt,
              },
            ],
            temperature: 0.2,
            response_format: { type: 'json_object' },
          },
          {
            timeout: Math.min(remaining, 6000),
          },
        );

        const text = completion.choices[0]?.message?.content?.trim();
        if (!text) {
          throw new Error('Respuesta vacía recibida desde Groq Cloud');
        }

        const cleanJson = this.sanitizeJsonString(text);
        return JSON.parse(cleanJson) as T;
      } catch (error: unknown) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        this.logger.warn(
          `Fallo en modelo ${modelName} de Groq Cloud: ${errorMsg}. Rotando al siguiente modelo...`,
        );
      }
    }

    this.logger.error(
      'Todos los modelos de la cascada de Groq Cloud fallaron. Activando Fallback Heurístico.',
    );
    return fallbackGenerator();
  }

  /**
   * Genera texto libre usando la cascada de modelos Groq Cloud y fallback heurístico
   */
  async generateText(prompt: string, fallbackGenerator: () => string): Promise<string> {
    if (!this.groqClient) {
      this.logger.warn('Cliente Groq Cloud no inicializado. Retornando texto de fallback.');
      return fallbackGenerator();
    }

    const deadline = Date.now() + 10000;
    for (const modelName of this.fallbackModels) {
      const remaining = deadline - Date.now();
      if (remaining < 500) break;
      try {
        const completion = await this.groqClient.chat.completions.create(
          {
            model: modelName,
            messages: [
              {
                role: 'user',
                content: prompt,
              },
            ],
            temperature: 0.4,
          },
          {
            timeout: Math.min(remaining, 6000),
          },
        );

        const text = completion.choices[0]?.message?.content?.trim();
        if (text && text.length > 0) {
          return text;
        }
      } catch (error: unknown) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        this.logger.warn(`Fallo en modelo ${modelName} de Groq Cloud para generateText: ${errorMsg}.`);
      }
    }

    return fallbackGenerator();
  }

  /**
   * Obtiene el nombre del modelo principal activo
   */
  getActiveModel(): string {
    return this.fallbackModels[0] || 'openai/gpt-oss-120b';
  }

  /**
   * Limpia posibles delimitadores markdown ```json ... ``` devueltos por el LLM
   */
  private sanitizeJsonString(rawText: string): string {
    let sanitized = rawText.trim();
    if (sanitized.startsWith('```json')) {
      sanitized = sanitized.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (sanitized.startsWith('```')) {
      sanitized = sanitized.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    return sanitized.trim();
  }
}
