// backend/src/modules/exams/exams.service.ts
import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { GeminiService } from '../../common/services/gemini.service';
import { SubmitExamDto } from './dto/submit-exam.dto';

@Injectable()
export class ExamsService {
  private readonly logger = new Logger(ExamsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly geminiService: GeminiService,
  ) {}

  async findOne(id: string) {
    const exam = await this.prisma.exam.findUnique({
      where: { id },
      include: {
        questions: {
          include: {
            options: true,
          },
        },
      },
    });

    if (!exam) {
      throw new NotFoundException(`Examen con ID ${id} no encontrado`);
    }

    return exam;
  }

  /**
   * RF-06.1 & RF-06.2:
   * Evalúa el examen formativo:
   * - Umbral de aprobación: 70%.
   * - Si aprueba (>= 70%), marca automáticamente la lección como completada.
   * - Reintentos libres inmutables: el histórico guarda cada intento y se computa la nota máxima histórica.
   * - Genera feedback pedagógico personalizado con Gemini o fallback heurístico.
   */
  async submitExam(userId: string, examId: string, dto: SubmitExamDto) {
    const exam = await this.findOne(examId);

    const questions = exam.questions;
    if (questions.length === 0) {
      throw new NotFoundException('El examen no contiene preguntas evaluativas.');
    }

    let correctCount = 0;
    const answerRecords: Array<{ questionId: string; selectedOptionId: string }> = [];

    for (const q of questions) {
      const submittedAns = dto.answers.find((a) => a.questionId === q.id);
      if (!submittedAns) continue;

      answerRecords.push({
        questionId: q.id,
        selectedOptionId: submittedAns.selectedOptionId,
      });

      const correctOpt = q.options.find((o) => o.isCorrect);
      if (correctOpt && correctOpt.id === submittedAns.selectedOptionId) {
        correctCount++;
      }
    }

    const scorePercentage = (correctCount / questions.length) * 100;
    const isPassed = scorePercentage >= (exam.passScore ?? 70.0);

    // Feedback pedagógico Skylearn con Gemini o fallback
    let aiFeedback = isPassed
      ? `¡Excelente trabajo! Has superado el examen con ${scorePercentage.toFixed(1)}% de aciertos.`
      : `Has obtenido ${scorePercentage.toFixed(1)}%. Repasa los conceptos clave y vuelve a intentarlo sin penalización.`;

    try {
      const prompt = `Actúa como tutor de Skylearn. Un estudiante rindió el examen "${exam.title}".
Aciertos: ${correctCount}/${questions.length} (${scorePercentage.toFixed(1)}%).
Aprobado: ${isPassed ? 'SÍ' : 'NO'}.
Genera un mensaje de aliento motivador, breve (máximo 2 oraciones), empático y formativo.`;

      aiFeedback = await this.geminiService.generateText(prompt, () => aiFeedback);
    } catch {
      this.logger.warn('Gemini timeout o error, usando feedback determinista.');
    }

    // Persistir el intento de forma inmutable
    const attempt = await this.prisma.examAttempt.create({
      data: {
        userId,
        examId,
        score: scorePercentage,
        isPassed,
        aiFeedback,
        answers: {
          create: answerRecords,
        },
      },
    });

    // Si aprobó y está asociado a una lección, marcar completada
    if (isPassed && exam.lessonId) {
      await this.prisma.lessonProgress.upsert({
        where: {
          userId_lessonId: { userId, lessonId: exam.lessonId },
        },
        update: { isCompleted: true, completedAt: new Date() },
        create: { userId, lessonId: exam.lessonId, isCompleted: true, completedAt: new Date() },
      });
    }

    // Consultar el récord histórico de intentos del alumno en este examen para reportar la nota máxima
    const attempts = await this.prisma.examAttempt.findMany({
      where: { userId, examId },
      orderBy: { createdAt: 'desc' },
    });

    const maxScore = Math.max(...attempts.map((a) => a.score));

    return {
      attemptId: attempt.id,
      score: scorePercentage,
      passScore: exam.passScore,
      isPassed,
      maxHistoricalScore: maxScore,
      totalQuestions: questions.length,
      correctAnswers: correctCount,
      aiFeedback,
      retryAllowed: true,
    };
  }
}
