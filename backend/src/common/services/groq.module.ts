// backend/src/common/services/groq.module.ts
import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GroqService } from './groq.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [GroqService],
  exports: [GroqService],
})
export class GroqModule {}
