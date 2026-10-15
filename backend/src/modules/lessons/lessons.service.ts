// backend/src/modules/lessons/lessons.service.ts
import { Injectable, NotFoundException, ForbiddenException, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateLessonDto } from './dto/create-lesson.dto';

@Injectable()
export class LessonsService {
  private readonly logger = new Logger(LessonsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Crea una lección en un módulo, asegurando:
   * 1. Pertenencia del módulo al docente autenticado.
   * 2. Enlace placeholder por defecto para recursos complementarios si no se provee.
   * 3. Creación opcional del formulario evaluativo con preguntas y opciones donde se marca la correcta.
   */
  async createLesson(moduleId: string, teacherId: string, dto: CreateLessonDto) {
    const module = await this.prisma.module.findUnique({
      where: { id: moduleId },
      include: { course: true },
    });

    if (!module) {
      throw new NotFoundException(`Módulo con ID ${moduleId} no encontrado`);
    }

    if (module.course.teacherId !== teacherId) {
      throw new ForbiddenException('No tienes permisos para agregar lecciones a este curso');
    }

    const downloadableUrl = dto.downloadableUrl?.trim() || 'https://skylearn.edu/resources/placeholder-guide.pdf';

    const lesson = await this.prisma.$transaction(async (tx) => {
      const newLesson = await tx.lesson.create({
        data: {
          moduleId,
          title: dto.title,
          videoUrl: dto.videoUrl,
          contextText: dto.contextText,
          downloadableUrl,
          order: dto.order,
        },
      });

      // Si el docente configuró el formulario evaluativo de la lección
      if (dto.examForm && dto.examForm.questions && dto.examForm.questions.length > 0) {
        const exam = await tx.exam.create({
          data: {
            lessonId: newLesson.id,
            title: dto.examForm.title || `Evaluación de la Lección: ${dto.title}`,
            passScore: 70.0,
          },
        });

        for (const q of dto.examForm.questions) {
          const question = await tx.question.create({
            data: {
              examId: exam.id,
              text: q.text,
              points: 1.0,
            },
          });

          for (const opt of q.options) {
            await tx.option.create({
              data: {
                questionId: question.id,
                text: opt.text,
                isCorrect: opt.isCorrect,
              },
            });
          }
        }
      }

      return newLesson;
    });

    return this.findOne(lesson.id);
  }

  async findOne(id: string) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id },
      include: {
        module: {
          include: {
            course: {
              select: { id: true, title: true, teacherId: true },
            },
          },
        },
        exams: {
          include: {
            questions: {
              include: {
                options: true,
              },
            },
          },
        },
      },
    });

    if (!lesson) {
      throw new NotFoundException(`Lección con ID ${id} no encontrada`);
    }

    return lesson;
  }

  /**
   * RF-05.1 & RF-05.2 & RF-05.3:
   * Valida acceso a una lección:
   * - Si ya fue desbloqueada antes: acceso permanente sin costo.
   * - Si tiene suscripción activa: acceso ilimitado sin costo.
   * - Si es primer acceso y tiene créditos > 0: debita 1 crédito y desbloquea permanentemente.
   * - Si balance = 0 y sin suscripción: lanza HTTP 402 Payment Required.
   */
  async accessLesson(userId: string, lessonId: string) {
    const lesson = await this.findOne(lessonId);

    // 1. Verificar si ya fue desbloqueada previamente
    const existingUnlock = await this.prisma.lessonUnlock.findUnique({
      where: {
        userId_lessonId: { userId, lessonId },
      },
    });

    const creditAccount = await this.prisma.creditAccount.findUnique({
      where: { userId },
    });

    const currentBalance = creditAccount?.balance ?? 0;

    if (existingUnlock) {
      return {
        lesson,
        isUnlocked: true,
        creditDebited: false,
        isPermanentUnlock: true,
        remainingCredits: currentBalance,
        message: 'Lección previamente desbloqueada. Acceso permanente sin costo de créditos.',
      };
    }

    // 2. Verificar si el usuario tiene suscripción activa
    const subscription = await this.prisma.subscription.findUnique({
      where: { userId },
    });

    if (subscription && subscription.status === 'ACTIVE') {
      await this.prisma.lessonUnlock.create({
        data: { userId, lessonId },
      });

      return {
        lesson,
        isUnlocked: true,
        creditDebited: false,
        isSubscription: true,
        remainingCredits: currentBalance,
        message: 'Acceso ilimitado por suscripción activa.',
      };
    }

    // 3. Si no tiene suscripción, verificar saldo de créditos
    if (currentBalance <= 0) {
      throw new HttpException(
        {
          statusCode: HttpStatus.PAYMENT_REQUIRED,
          message:
            'Has consumido tus 3 créditos iniciales gratuitos. Suscríbete para acceder de forma ilimitada a todas las lecciones del catálogo.',
          error: 'Payment Required',
          requiresPayment: true,
        },
        HttpStatus.PAYMENT_REQUIRED,
      );
    }

    // 4. Debitar 1 crédito y registrar el desbloqueo permanente
    const [updatedAccount] = await this.prisma.$transaction([
      this.prisma.creditAccount.update({
        where: { userId },
        data: { balance: { decrement: 1 } },
      }),
      this.prisma.lessonUnlock.create({
        data: { userId, lessonId },
      }),
    ]);

    return {
      lesson,
      isUnlocked: true,
      creditDebited: true,
      isPermanentUnlock: true,
      remainingCredits: updatedAccount.balance,
      message: '1 crédito debitado con éxito. Esta lección ha quedado desbloqueada permanentemente.',
    };
  }

  /**
   * RF-05.4: Registro de completitud de la lección (modo manual o tras examen)
   */
  async completeLesson(userId: string, lessonId: string) {
    await this.findOne(lessonId);

    const progress = await this.prisma.lessonProgress.upsert({
      where: {
        userId_lessonId: { userId, lessonId },
      },
      update: {
        isCompleted: true,
        completedAt: new Date(),
      },
      create: {
        userId,
        lessonId,
        isCompleted: true,
        completedAt: new Date(),
      },
    });

    return {
      lessonId,
      isCompleted: progress.isCompleted,
      completedAt: progress.completedAt,
    };
  }

  /**
   * RF-05.4: Sincronización batch de progreso de lecciones
   */
  async syncProgressBatch(userId: string, lessonIds: string[]) {
    const results = await Promise.all(
      lessonIds.map(async (lessonId) => {
        return this.prisma.lessonProgress.upsert({
          where: { userId_lessonId: { userId, lessonId } },
          update: { isCompleted: true, completedAt: new Date() },
          create: { userId, lessonId, isCompleted: true, completedAt: new Date() },
        });
      }),
    );

    return {
      syncedCount: results.length,
      items: results,
    };
  }
}
