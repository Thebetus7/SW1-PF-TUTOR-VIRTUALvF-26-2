// backend/src/modules/tutor/tutor.module.ts
import { Module } from '@nestjs/common';
import { TutorService } from './tutor.service';
import { TutorController } from './tutor.controller';
import { SpeechService } from './speech.service';
import { LiveTutorService } from './live.service';

@Module({
  controllers: [TutorController],
  providers: [TutorService, SpeechService, LiveTutorService],
  exports: [TutorService],
})
export class TutorModule {}
