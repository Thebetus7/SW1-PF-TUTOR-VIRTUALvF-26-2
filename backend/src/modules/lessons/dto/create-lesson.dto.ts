// backend/src/modules/lessons/dto/create-lesson.dto.ts
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  IsInt,
  Min,
  ValidateNested,
  IsArray,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateOptionDto {
  @IsString()
  @IsNotEmpty({ message: 'El texto de la opción no puede estar vacío' })
  text: string;

  @IsBoolean()
  isCorrect: boolean;
}

export class CreateQuestionDto {
  @IsString()
  @IsNotEmpty({ message: 'El enunciado de la pregunta es obligatorio' })
  text: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOptionDto)
  options: CreateOptionDto[];
}

export class CreateLessonExamDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateQuestionDto)
  questions: CreateQuestionDto[];
}

export class CreateLessonDto {
  @IsString()
  @IsNotEmpty({ message: 'El título de la lección es obligatorio' })
  title: string;

  @IsUrl({}, { message: 'El videoUrl debe ser una URL válida' })
  @Matches(/^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/, {
    message: 'La URL del video debe pertenecer al dominio canónico de YouTube (youtube.com o youtu.be)',
  })
  videoUrl: string;

  @IsString()
  @IsNotEmpty({ message: 'La variable de contexto del video es obligatoria' })
  contextText: string;

  @IsOptional()
  @IsString()
  downloadableUrl?: string; // Si se omite, se establece placeholder

  @IsInt()
  @Min(1)
  order: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => CreateLessonExamDto)
  examForm?: CreateLessonExamDto; // Formulario evaluativo opcional de opciones configuradas por el docente
}
