// backend/src/modules/recommendations/dto/submit-quiz.dto.ts
import { IsArray, IsNotEmpty, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class QuizAnswerItemDto {
  @IsString()
  @IsNotEmpty()
  questionId: string;

  @IsNumber()
  optionIndex: number;

  @IsOptional()
  @IsString()
  selectedText?: string;
}

export class SubmitQuizDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuizAnswerItemDto)
  answers: QuizAnswerItemDto[];
}
