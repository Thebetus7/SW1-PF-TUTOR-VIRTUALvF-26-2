import { IsIn, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class SpeechDto {
  @IsString()
  @MinLength(1)
  @MaxLength(4000)
  text: string;

  @IsIn(['male', 'female'])
  gender: 'male' | 'female';
}

export class LiveTutorDto {
  @IsUUID()
  lessonId: string;

  @IsIn(['male', 'female'])
  gender: 'male' | 'female';
}
