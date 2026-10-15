// backend/src/modules/tutor/dto/test-connection.dto.ts
import { IsOptional, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class TestConnectionDto {
  @ApiPropertyOptional({ description: 'Modo demostración para retorno de frase dinámica en vivo', default: true })
  @IsOptional()
  @IsBoolean()
  demoMode?: boolean = true;
}

export interface VisemeFrame {
  timeMs: number;
  shape: 'sil' | 'aa' | 'E' | 'ih' | 'oh' | 'ou';
  weight: number;
}

export interface TestConnectionResponseDto {
  success: boolean;
  provider: 'Google Gemini';
  modelUsed: string;
  phrase: string;
  timestamp: string;
  visemes: VisemeFrame[];
}
