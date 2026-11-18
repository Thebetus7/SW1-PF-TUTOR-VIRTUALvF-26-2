// backend/src/modules/tutor/live.service.ts
import { Injectable, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class LiveTutorService {
  constructor(private readonly config: ConfigService, private readonly prisma: PrismaService) {}

  async token(userId: string, role: string, lessonId: string, _gender: 'male' | 'female') {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        module: {
          include: {
            course: {
              include: { enrollments: { where: { userId } } },
            },
          },
        },
      },
    });

    if (!lesson || (role === 'STUDENT' && !lesson.module.course.enrollments.length)) {
      throw new ForbiddenException('Inscríbete al curso antes de iniciar la conversación.');
    }

    const groqModel = this.config.get<string>('GROQ_DEFAULT_MODEL') || 'openai/gpt-oss-120b';

    return {
      provider: 'Groq Cloud',
      model: groqModel,
      chatEndpoint: '/tutor/chat',
      speechEndpoint: '/tutor/speech',
      message: 'La tutoría por voz interactiva está habilitada mediante Groq Cloud y síntesis de voz.',
    };
  }
}
