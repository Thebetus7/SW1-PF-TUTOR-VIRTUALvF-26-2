// backend/src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './common/prisma/prisma.module';
import { GroqModule } from './common/services/groq.module';
import { AuthModule } from './modules/auth/auth.module';
import { CoursesModule } from './modules/courses/courses.module';
import { LessonsModule } from './modules/lessons/lessons.module';
import { RecommendationsModule } from './modules/recommendations/recommendations.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { ExamsModule } from './modules/exams/exams.module';
import { TutorModule } from './modules/tutor/tutor.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    GroqModule,
    AuthModule,
    CoursesModule,
    LessonsModule,
    RecommendationsModule,
    PaymentsModule,
    ExamsModule,
    TutorModule,
    AnalyticsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
