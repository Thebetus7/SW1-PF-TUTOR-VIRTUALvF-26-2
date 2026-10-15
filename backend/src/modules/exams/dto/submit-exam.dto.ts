// backend/src/modules/exams/dto/submit-exam.dto.ts
import { IsArray, IsNotEmpty, IsUUID, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class ExamAnswerDto {
  @IsUUID('4')
  questionId: string;

  @IsUUID('4')
  selectedOptionId: string;
}

export class SubmitExamDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExamAnswerDto)
  answers: ExamAnswerDto[];
}
