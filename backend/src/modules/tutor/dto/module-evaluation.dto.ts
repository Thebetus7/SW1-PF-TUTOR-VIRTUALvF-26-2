// backend/src/modules/tutor/dto/module-evaluation.dto.ts
import { IsNotEmpty, IsUUID, IsInt, Min, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { VisemeFrame } from './test-connection.dto';

export class StartModuleEvaluationDto {
  @ApiProperty({ description: 'ID del módulo de cuyas lecciones se recopila contexto', example: 'uuid-modulo' })
  @IsNotEmpty()
  @IsUUID()
  moduleId: string;
}

export interface CollectedLessonSummary {
  id: string;
  order: number;
  title: string;
  contextSummary: string;
}

export interface StartModuleEvaluationResponseDto {
  moduleId: string;
  moduleTitle: string;
  totalLessons: number;
  currentLessonIndex: number;
  currentLessonTitle: string;
  questionText: string;
  visemes: VisemeFrame[];
  collectedContext: {
    lessons: CollectedLessonSummary[];
  };
}

export class AnswerModuleEvaluationDto {
  @ApiProperty({ description: 'ID del módulo en evaluación', example: 'uuid-modulo' })
  @IsNotEmpty()
  @IsUUID()
  moduleId: string;

  @ApiProperty({ description: 'Índice de la lección evaluada (base 0)', example: 0 })
  @IsInt()
  @Min(0)
  lessonIndex: number;

  @ApiProperty({ description: 'Respuesta brindada por el estudiante (vía voz o texto)', example: 'Las variables permiten almacenar datos en memoria.' })
  @IsString()
  @IsNotEmpty()
  userResponse: string;
}

export type AvatarEmotionType = 'explaining' | 'listening' | 'celebrating' | 'encouraging';

export interface AnswerModuleEvaluationResponseDto {
  isCorrect: boolean;
  feedbackText: string;
  visemes: VisemeFrame[];
  avatarEmotion: AvatarEmotionType;
  hasNextLesson: boolean;
  nextQuestion?: {
    lessonIndex: number;
    lessonTitle: string;
    questionText: string;
  };
  finalSummary?: {
    approved: boolean;
    scorePercentage: number;
    closingRemarks: string;
    attemptId?: string;
  };
}
