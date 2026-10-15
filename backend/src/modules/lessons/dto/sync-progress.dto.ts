// backend/src/modules/lessons/dto/sync-progress.dto.ts
import { IsArray, IsUUID } from 'class-validator';

export class SyncProgressDto {
  @IsArray()
  @IsUUID('4', { each: true })
  lessonIds: string[];
}
