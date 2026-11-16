import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as sdk from 'microsoft-cognitiveservices-speech-sdk';

@Injectable()
export class SpeechService {
  constructor(private readonly config: ConfigService) {}

  async synthesize(text: string, gender: 'male' | 'female') {
    const key = this.config.get<string>('AZURE_SPEECH_KEY');
    const region = this.config.get<string>('AZURE_SPEECH_REGION');
    if (!key || !region) return { provider: 'browser' as const };
    const config = sdk.SpeechConfig.fromSubscription(key, region);
    config.speechSynthesisVoiceName = gender === 'female' ? 'es-ES-ElviraNeural' : 'es-ES-AlvaroNeural';
    config.speechSynthesisOutputFormat = sdk.SpeechSynthesisOutputFormat.Riff24Khz16BitMonoPcm;
    const synth = new sdk.SpeechSynthesizer(config, null);
    const words: Array<{ time: number; start: number; length: number }> = [];
    const visemes: Array<{ time: number; id: number }> = [];
    synth.wordBoundary = (_, event) => words.push({ time: event.audioOffset / 10000000, start: event.textOffset, length: event.wordLength });
    synth.visemeReceived = (_, event) => visemes.push({ time: event.audioOffset / 10000000, id: event.visemeId });
    try {
      const result = await new Promise<sdk.SpeechSynthesisResult>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Tiempo de voz agotado')), 12000);
        synth.speakTextAsync(text, value => { clearTimeout(timeout); resolve(value); }, error => { clearTimeout(timeout); reject(new Error(error)); });
      });
      if (result.reason !== sdk.ResultReason.SynthesizingAudioCompleted) throw new Error('Síntesis cancelada');
      return { provider: 'azure' as const, audio: Buffer.from(result.audioData).toString('base64'), words, visemes };
    } catch {
      throw new ServiceUnavailableException('La voz no está disponible. Puedes continuar leyendo.');
    } finally { synth.close(); }
  }
}
