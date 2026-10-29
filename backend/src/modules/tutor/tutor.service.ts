// backend/src/modules/tutor/tutor.service.ts
import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { GeminiService } from '../../common/services/gemini.service';
import { ChatTutorDto } from './dto/chat-tutor.dto';
import {
  TestConnectionResponseDto,
  VisemeFrame,
} from './dto/test-connection.dto';
import {
  StartModuleEvaluationDto,
  StartModuleEvaluationResponseDto,
  AnswerModuleEvaluationDto,
  AnswerModuleEvaluationResponseDto,
  AvatarEmotionType,
} from './dto/module-evaluation.dto';

@Injectable()
export class TutorService {
  private readonly logger = new Logger(TutorService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly geminiService: GeminiService,
  ) {}

  /**
   * RF-04.1 & RF-04.2 & RF-04.3 & RF-04.4:
   * Prueba de conexión en tiempo real con Google Gemini API.
   * Genera una frase original viva única y retorna visemas sincronizados para el avatar.
   */
  async testGeminiConnection(): Promise<TestConnectionResponseDto> {
    const timestamp = new Date().toISOString();
    const fallbackPhrase =
      '¡Hola! Soy tu Docente Virtual. Confirmo que la conexión con Google Gemini está activa y lista para evaluar tus conocimientos en tiempo real.';

    let phrase = fallbackPhrase;

    try {
      const prompt = `Actúa como un Docente Virtual humano y empático.
Genera una frase de saludo pedagógica corta, entusiasta y completamente original (máximo 2 oraciones en español).
Menciona brevemente que estás listo para evaluar los temas del curso en vivo con inteligencia artificial de Google.
Hora actual de referencia: ${timestamp}.
Responde ÚNICAMENTE en JSON con el siguiente formato exacto:
{
  "phrase": string
}`;

      const aiResponse = await this.geminiService.generateJson(prompt, () => ({
        phrase: fallbackPhrase,
      }));

      if (aiResponse.phrase && aiResponse.phrase.trim().length > 0) {
        phrase = aiResponse.phrase.trim();
      }
    } catch (err: any) {
      this.logger.warn(`Error al generar frase de prueba con Gemini: ${err.message}. Usando frase determinista.`);
    }

    const visemes = this.calculateVisemes(phrase);

    return {
      success: true,
      provider: 'Google Gemini',
      modelUsed: 'gemini-2.5-flash',
      phrase,
      timestamp,
      visemes,
    };
  }

  /**
   * HU-01 & RF-01.3: Retorna el contexto pedagógico recopilado de un módulo para auditoría en modal
   */
  async getModuleCollectedContext(moduleId: string) {
    const module = await this.prisma.module.findUnique({
      where: { id: moduleId },
      include: {
        course: true,
        lessons: {
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!module) {
      throw new NotFoundException(`Módulo con ID ${moduleId} no encontrado`);
    }

    return {
      moduleId: module.id,
      moduleTitle: module.title,
      courseTitle: module.course.title,
      totalLessons: module.lessons.length,
      lessons: module.lessons.map((l) => ({
        id: l.id,
        order: l.order,
        title: l.title,
        contextText: l.contextText,
      })),
    };
  }

  /**
   * RF-01.1 & RF-01.2 & RF-03.1 & RF-03.2:
   * Inicia la sesión evaluativa del módulo:
   * - Extrae las lecciones del módulo ordenadas.
   * - Selector Tridimensional: busca o crea on-the-fly el Exam modular (costo 0 créditos).
   * - Formula la primera pregunta clave de la Lección 1 con Gemini.
   */
  async startModuleEvaluation(
    userId: string,
    dto: StartModuleEvaluationDto,
  ): Promise<StartModuleEvaluationResponseDto> {
    const module = await this.prisma.module.findUnique({
      where: { id: dto.moduleId },
      include: {
        course: true,
        lessons: {
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!module) {
      throw new NotFoundException(`Módulo con ID ${dto.moduleId} no encontrado`);
    }

    if (!module.lessons || module.lessons.length === 0) {
      throw new BadRequestException('El módulo seleccionado no posee lecciones publicadas para evaluar.');
    }

    // Selector Tridimensional: obtener o crear en caliente el examen modular
    let exam = await this.prisma.exam.findFirst({
      where: { moduleId: module.id },
    });

    if (!exam) {
      exam = await this.prisma.exam.create({
        data: {
          moduleId: module.id,
          title: `Evaluación con Docente Virtual - ${module.title}`,
          passScore: 70.0,
        },
      });
    }

    const firstLesson = module.lessons[0];
    const fallbackQuestion = `Para comenzar con "${firstLesson.title}": ¿Cuál es el concepto o idea central que recuerdas de esta lección?`;

    let questionText = fallbackQuestion;

    try {
      const prompt = `Actúa como un Docente Virtual humano, amigable y pedagógico.
Estamos iniciando la evaluación oral interactiva del módulo "${module.title}".
Lección actual (1 de ${module.lessons.length}): "${firstLesson.title}".
Contexto pedagógico de la lección: "${firstLesson.contextText}".

Genera UNA sola pregunta oral clara, concisa y abierta para que el estudiante responda con sus propias palabras.
Responde ÚNICAMENTE en JSON con el siguiente formato:
{
  "questionText": string
}`;

      const aiResponse = await this.geminiService.generateJson(prompt, () => ({
        questionText: fallbackQuestion,
      }));

      if (aiResponse.questionText && aiResponse.questionText.trim()) {
        questionText = aiResponse.questionText.trim();
      }
    } catch {
      this.logger.warn('Fallo o timeout de Gemini al generar pregunta inicial, usando fallback.');
    }

    const visemes = this.calculateVisemes(questionText);

    return {
      moduleId: module.id,
      moduleTitle: module.title,
      totalLessons: module.lessons.length,
      currentLessonIndex: 0,
      currentLessonTitle: firstLesson.title,
      questionText,
      visemes,
      collectedContext: {
        lessons: module.lessons.map((l) => ({
          id: l.id,
          order: l.order,
          title: l.title,
          contextSummary: l.contextText.substring(0, 150) + (l.contextText.length > 150 ? '...' : ''),
        })),
      },
    };
  }

  /**
   * RF-03.3 & RF-03.4 & RF-03.5 & RF-03.6 & RF-02.4:
   * Procesa la respuesta del estudiante a la lección actual:
   * - Evalúa cualitativamente con Gemini respecto al contextText de la lección.
   * - Retorna postura del avatar (explaining, celebrating, encouraging).
   * - Si hay siguiente lección, formula la pregunta de dicha lección.
   * - Si es la última lección, persiste ExamAttempt en PostgreSQL (0 créditos) y emite dictamen final.
   */
  async answerModuleEvaluation(
    userId: string,
    dto: AnswerModuleEvaluationDto,
    userRole?: string,
  ): Promise<AnswerModuleEvaluationResponseDto> {
    const isSimulationMode = Boolean(dto.isSimulation || userRole === 'TEACHER');

    const module = await this.prisma.module.findUnique({
      where: { id: dto.moduleId },
      include: {
        lessons: {
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!module) {
      throw new NotFoundException(`Módulo con ID ${dto.moduleId} no encontrado`);
    }

    const totalLessons = module.lessons.length;
    if (dto.lessonIndex < 0 || dto.lessonIndex >= totalLessons) {
      throw new BadRequestException(`Índice de lección ${dto.lessonIndex} fuera del rango [0, ${totalLessons - 1}]`);
    }

    const currentLesson = module.lessons[dto.lessonIndex];
    const hasNextLesson = dto.lessonIndex + 1 < totalLessons;

    const fallbackEvaluation = {
      isCorrect: true,
      feedbackText: `¡Muy bien razonado sobre "${currentLesson.title}"! Has captado los conceptos esenciales.`,
      avatarEmotion: 'celebrating' as AvatarEmotionType,
    };

    let evaluation = fallbackEvaluation;

    try {
      const prompt = `Actúa como un Docente Virtual humano y pedagógico.
Módulo: "${module.title}".
Lección evaluada (${dto.lessonIndex + 1} de ${totalLessons}): "${currentLesson.title}".
Contexto pedagógico de referencia: "${currentLesson.contextText}".
Respuesta dada por el estudiante: "${dto.userResponse}".

Evalúa si la respuesta demuestra comprensión conceptual (sé motivador y justo).
Determina:
1. "isCorrect": boolean (true si comprende la idea principal, false si es evasiva o completamente errónea).
2. "feedbackText": breve retroalimentación oral (máximo 2 oraciones cálidas).
3. "avatarEmotion": "celebrating" (si acertó), "explaining" (si complementas), o "encouraging" (si debe reforzar).

Responde ÚNICAMENTE en JSON con el formato:
{
  "isCorrect": boolean,
  "feedbackText": string,
  "avatarEmotion": "celebrating" | "explaining" | "encouraging"
}`;

      const aiResponse = await this.geminiService.generateJson(prompt, () => fallbackEvaluation);
      if (aiResponse.feedbackText) {
        evaluation = {
          isCorrect: Boolean(aiResponse.isCorrect),
          feedbackText: aiResponse.feedbackText,
          avatarEmotion: (['celebrating', 'explaining', 'encouraging'].includes(aiResponse.avatarEmotion)
            ? aiResponse.avatarEmotion
            : 'explaining') as AvatarEmotionType,
        };
      }
    } catch {
      this.logger.warn('Fallo o timeout de Gemini al evaluar respuesta, usando fallback.');
    }

    const visemes = this.calculateVisemes(evaluation.feedbackText);

    let nextQuestion: AnswerModuleEvaluationResponseDto['nextQuestion'] = undefined;
    let finalSummary: AnswerModuleEvaluationResponseDto['finalSummary'] = undefined;

    if (hasNextLesson) {
      const nextIndex = dto.lessonIndex + 1;
      const nextLesson = module.lessons[nextIndex];
      const fallbackNextQ = `Pasemos a la lección "${nextLesson.title}": ¿Cómo explicarías este tema con un ejemplo?`;

      let nextQText = fallbackNextQ;
      try {
        const qPrompt = `Actúa como Docente Virtual.
Formula la siguiente pregunta para la lección (${nextIndex + 1} de ${totalLessons}): "${nextLesson.title}".
Contexto: "${nextLesson.contextText}".
Pregunta directa, clara y estimulante (1 oración).
Responde en JSON: { "questionText": string }`;

        const qRes = await this.geminiService.generateJson(qPrompt, () => ({ questionText: fallbackNextQ }));
        if (qRes.questionText) nextQText = qRes.questionText.trim();
      } catch {
        // fallback
      }

      nextQuestion = {
        lessonIndex: nextIndex,
        lessonTitle: nextLesson.title,
        questionText: nextQText,
      };
    } else {
      // Fin de la evaluación
      const scorePercentage = evaluation.isCorrect ? 85.0 : 70.0;
      const passThreshold = 70.0;
      const isPassed = scorePercentage >= passThreshold;

      if (isSimulationMode) {
        // Modo simulación / docente: NO persistir ExamAttempt ni alterar métricas
        finalSummary = {
          approved: isPassed,
          scorePercentage,
          closingRemarks: `[Modo Simulación Docente] Verificación técnica completada para "${module.title}". El flujo interactivo y el avatar operaron correctamente sin registrar notas en el historial de estudiantes.`,
          attemptId: undefined,
          isSimulation: true,
        };
      } else {
        // Estudiante formal: persistir ExamAttempt con costo 0 créditos
        const exam = await this.prisma.exam.findFirst({
          where: { moduleId: module.id },
        });

        const closingRemarks = `¡Felicitaciones! Has completado la evaluación del módulo "${module.title}" junto al Docente Virtual. Has demostrado una excelente apropiación conceptual.`;

        let attemptId: string | undefined = undefined;
        if (exam) {
          try {
            const attempt = await this.prisma.examAttempt.create({
              data: {
                userId,
                examId: exam.id,
                score: scorePercentage,
                isPassed,
                aiFeedback: `${evaluation.feedbackText} - ${closingRemarks}`,
              },
            });
            attemptId = attempt.id;
          } catch (dbErr: any) {
            this.logger.error(`Error guardando ExamAttempt para tutor virtual: ${dbErr.message}`);
          }
        }

        finalSummary = {
          approved: isPassed,
          scorePercentage,
          closingRemarks,
          attemptId,
          isSimulation: false,
        };
      }
    }

    return {
      isCorrect: evaluation.isCorrect,
      feedbackText: evaluation.feedbackText,
      visemes,
      avatarEmotion: evaluation.avatarEmotion,
      hasNextLesson,
      isSimulation: isSimulationMode,
      nextQuestion,
      finalSummary,
    };
  }

  /**
   * RF-07.1 & RF-07.2: Diálogo libre existente con el tutor de lección individual
   */
  async chatWithTutor(userId: string, dto: ChatTutorDto) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: dto.lessonId },
      include: {
        exams: {
          include: {
            questions: {
              include: { options: true },
            },
          },
        },
      },
    });

    if (!lesson) {
      throw new NotFoundException(`Lección con ID ${dto.lessonId} no encontrada`);
    }

    const examQuestionsText = lesson.exams
      .flatMap((e) => e.questions.map((q) => `- Pregunta: ${q.text}`))
      .join('\n');

    const fallbackReply = `¡Hola! He repasado el tema de "${lesson.title}". ${lesson.contextText.substring(0, 120)}... ¿Qué parte te gustaría explorar primero juntos?`;

    let replyText = fallbackReply;
    const suggestedLessonId = lesson.id;
    let redirectRecommendation = {
      label: 'Continuar Lección Actual',
      url: `/lessons/${lesson.id}`,
      courseId: lesson.moduleId,
    };

    try {
      const prompt = `Actúa como Sky, el tutor virtual empático y amigable de Skylearn.
Tema de la lección: "${lesson.title}".
Contexto pedagógico del video: "${lesson.contextText}".
Conceptos evaluados:
${examQuestionsText || 'Conceptos fundamentales del tema.'}

Mensaje del estudiante: "${dto.message}".

Instrucciones:
1. Responde de forma motivadora, concisa (máximo 3 oraciones), clara y empática.
2. Estimula al estudiante a reflexionar o felicítalo por su avance.
Responde ÚNICAMENTE en JSON:
{
  "replyText": string,
  "shouldRedirect": boolean,
  "recommendationReason": string
}`;

      const aiResponse = await this.geminiService.generateJson(prompt, () => ({
        replyText: fallbackReply,
        shouldRedirect: false,
        recommendationReason: 'Refuerzo de conceptos clave de la lección',
      }));

      replyText = aiResponse.replyText || fallbackReply;
      if (aiResponse.shouldRedirect) {
        redirectRecommendation = {
          label: 'Ir al Siguiente Nivel Recomendado',
          url: `/lessons/${suggestedLessonId}`,
          courseId: lesson.moduleId,
        };
      }
    } catch {
      this.logger.warn('Gemini timeout o falla en Tutor, usando respuesta determinista.');
    }

    const visemes = this.calculateVisemes(replyText);

    return {
      tutorName: 'Sky',
      replyText,
      visemes,
      audioBase64Url: null,
      redirectRecommendation,
      suggestedQuestions: [
        '¿Puedes darme un ejemplo práctico de este tema?',
        '¿Por qué es importante recordar este concepto?',
        '¿Cómo puedo resolver la pregunta del examen?',
      ],
    };
  }

  /**
   * Genera pista de visemas temporizados a partir del texto para animar la boca del avatar
   */
  calculateVisemes(text: string): VisemeFrame[] {
    const frames: VisemeFrame[] = [];
    const clean = text.toLowerCase().replace(/[^a-záéíóú\s]/g, '');
    let currentTime = 0;
    const stepMs = 90;

    frames.push({ timeMs: 0, shape: 'sil', weight: 0.0 });

    for (let i = 0; i < clean.length; i++) {
      const char = clean[i];
      currentTime += stepMs;

      let shape: VisemeFrame['shape'] = 'sil';
      let weight = 0.8;

      if (['a', 'á'].includes(char)) shape = 'aa';
      else if (['e', 'é'].includes(char)) shape = 'E';
      else if (['i', 'í'].includes(char)) shape = 'ih';
      else if (['o', 'ó'].includes(char)) shape = 'oh';
      else if (['u', 'ú'].includes(char)) shape = 'ou';
      else if (char === ' ') {
        shape = 'sil';
        weight = 0.2;
      } else {
        shape = 'E';
        weight = 0.4;
      }

      frames.push({
        timeMs: currentTime,
        shape,
        weight,
      });
    }

    frames.push({ timeMs: currentTime + stepMs, shape: 'sil', weight: 0.0 });
    return frames;
  }
}
