// backend/src/modules/lessons/dto/update-lesson.dto.ts
import {
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  IsInt,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateLessonExamDto } from './create-lesson.dto';

export class UpdateLessonDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsUrl({}, { message: 'El videoUrl debe ser una URL válida' })
  @Matches(/^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/, {
    message: 'La URL del video debe pertenecer al dominio canónico de YouTube (youtube.com o youtu.be)',
  })
  videoUrl?: string;

  @IsOptional()
  @IsString()
  contextText?: string;

  @IsOptional()
  @IsString()
  downloadableUrl?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  order?: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => CreateLessonExamDto)
  examForm?: CreateLessonExamDto;
}
