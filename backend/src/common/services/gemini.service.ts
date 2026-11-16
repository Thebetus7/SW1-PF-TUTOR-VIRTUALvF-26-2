// backend/src/common/services/gemini.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);
  private genAI: GoogleGenerativeAI | null = null;

  // Cascada de modelos vigentes para Capa Gratuita (Free Tier)
  // Conforme a la regla universal: gemini-1.5-flash y gemini-2.0-flash están obsoletos/retirados
  private readonly fallbackModels = ['gemini-2.5-flash', 'gemini-2.5-flash-lite'];

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (apiKey && apiKey !== 'AIzaSyDemoKeyForDevelopmentMode2026') {
      this.genAI = new GoogleGenerativeAI(apiKey);
    } else {
      this.logger.warn(
        'GEMINI_API_KEY no configurada o es clave demo; se activará el Fallback Heurístico Determinista por defecto.',
      );
    }
  }

  /**
   * Genera contenido estructurado en JSON rotando por la lista en cascada de modelos vigentes.
   * Implementa timeout preventivo estricto de 10s y sanitización automática de markdown.
   */
  async generateJson<T>(prompt: string, fallbackGenerator: () => T): Promise<T> {
    if (!this.genAI) {
      this.logger.debug('Sin cliente Gemini activo, ejecutando fallback determinista');
      return fallbackGenerator();
    }

    const deadline = Date.now() + 10000;
    for (const modelName of this.fallbackModels) {
      const remaining = deadline - Date.now();
      if (remaining < 500) break;
      try {
        this.logger.log(`Intentando inferencia Gemini con modelo: ${modelName}`);
        const model = this.genAI.getGenerativeModel({
          model: modelName,
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.2,
          },
        });

        const response = await model.generateContent(prompt, { timeout: Math.min(remaining, 6000) });
        const text = response.response.text();

        const cleanJson = this.sanitizeJsonString(text);
        return JSON.parse(cleanJson) as T;
      } catch (error: any) {
        this.logger.warn(
          `Fallo en modelo ${modelName}: ${error?.message || error}. Rotando al siguiente modelo...`,
        );
        // Continuar con el siguiente modelo en la cascada
      }
    }

    this.logger.error('Todos los modelos de la cascada fallaron o agotaron cuota. Activando Fallback Heurístico.');
    return fallbackGenerator();
  }

  /**
   * Genera texto libre usando la cascada de modelos Gemini vigentes y fallback heurístico
   */
  async generateText(prompt: string, fallbackGenerator: () => string): Promise<string> {
    if (!this.genAI) {
      this.logger.warn('Google GenAI no inicializado. Retornando texto de fallback.');
      return fallbackGenerator();
    }

    const deadline = Date.now() + 10000;
    for (const modelName of this.fallbackModels) {
      const remaining = deadline - Date.now();
      if (remaining < 500) break;
      try {
        const model = this.genAI.getGenerativeModel({
          model: modelName,
          generationConfig: {
            temperature: 0.4,
          },
        });

        const response = await model.generateContent(prompt, { timeout: Math.min(remaining, 6000) });
        return response.response.text().trim();
      } catch (error: any) {
        this.logger.warn(`Fallo en modelo ${modelName} para generateText: ${error?.message || error}.`);
      }
    }

    return fallbackGenerator();
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
