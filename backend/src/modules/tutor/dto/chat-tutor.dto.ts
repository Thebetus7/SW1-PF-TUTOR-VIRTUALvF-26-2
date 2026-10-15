// backend/src/modules/tutor/dto/chat-tutor.dto.ts
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class ChatTutorDto {
  @IsUUID('4')
  lessonId: string;

  @IsString()
  @IsNotEmpty()
  message: string;

  @IsOptional()
  @IsString()
  audioBase64?: string;
}
