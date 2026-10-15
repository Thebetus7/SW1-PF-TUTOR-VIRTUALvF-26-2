// backend/src/modules/recommendations/recommendations.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { GeminiService } from '../../common/services/gemini.service';
import { SubmitQuizDto } from './dto/submit-quiz.dto';
import { CourseStatus } from '@prisma/client';

@Injectable()
export class RecommendationsService {
  private readonly logger = new Logger(RecommendationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly geminiService: GeminiService,
  ) {}

  /**
   * RF-03.2: Genera un cuestionario simple de 3 a 5 preguntas con incisos de opción múltiple
   * elaborado a partir de los cursos y categorías activas.
   */
  async getQuiz() {
    const courses = await this.prisma.course.findMany({
      where: { status: CourseStatus.PUBLISHED },
      include: { category: true },
      take: 5,
    });

    const categoriesList = Array.from(new Set(courses.map((c) => c.category?.name || 'General')));

    return {
      title: 'Descubre qué Aprender en Skylearn',
      description: 'Responde estas breves preguntas para generar tu ruta personalizada sin costo de créditos.',
      questions: [
        {
          id: 'q-interests',
          text: '¿Qué área tecnológica te despierta mayor curiosidad aprender?',
          options: categoriesList.length > 0
            ? categoriesList
            : ['Desarrollo Web Frontend', 'Backend y APIs', 'Inteligencia Artificial', 'Diseño UI/UX'],
        },
        {
          id: 'q-experience',
          text: '¿Cuál es tu nivel de experiencia en programación?',
          options: [
            'Principiante absoluto (desde cero)',
            'Básico (he escrito código simple o HTML)',
            'Intermedio (he creado proyectos pequeños)',
          ],
        },
        {
          id: 'q-goal',
          text: '¿Cuál es tu principal objetivo de aprendizaje?',
          options: [
            'Aprender jugando y con tutoría virtual paso a paso',
            'Crear mi primera aplicación completa para mi portafolio',
            'Comprender la lógica de algoritmos y programación',
          ],
        },
      ],
    };
  }

  /**
   * RF-03.3 & RF-03.4 & RF-04.1:
   * Procesa las respuestas, ensambla la LearningPath con Gemini (o fallback) a costo 0 de créditos
   * e inscribe al alumno con enlace directo de redirección.
   */
  async submitQuiz(userId: string, dto: SubmitQuizDto) {
    this.logger.log(`Procesando respuestas del cuestionario para el usuario: ${userId}`);

    const courses = await this.prisma.course.findMany({
      where: { status: CourseStatus.PUBLISHED },
      include: {
        category: true,
        modules: {
          include: {
            lessons: { orderBy: { order: 'asc' } },
          },
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Fallback heurístico determinista si no hay cursos o si Gemini falla
    const defaultCourse = courses[0];
    const defaultLesson = defaultCourse?.modules[0]?.lessons[0];

    const fallbackGenerator = () => {
      this.logger.warn('Ejecutando compilación determinista por fallback heurístico.');
      return {
        selectedCourseId: defaultCourse?.id || 'demo-course',
        courseTitle: defaultCourse?.title || 'Curso Recomendado',
        recommendedLessonId: defaultLesson?.id || 'demo-lesson',
        pathTitle: `Ruta Adaptativa: ${defaultCourse?.title || 'General'}`,
        reason: 'Ruta secuenciada según tu nivel de partida y preferencias seleccionadas.',
      };
    };

    let aiRecommendation = fallbackGenerator();

    if (courses.length > 0) {
      const prompt = `Actúa como asesor pedagógico del LMS Skylearn.
Cursos disponibles: ${JSON.stringify(
        courses.map((c) => ({
          id: c.id,
          title: c.title,
          category: c.category?.name,
          firstLessonId: c.modules[0]?.lessons[0]?.id,
        })),
      )}.
Respuestas del estudiante al test: ${JSON.stringify(dto.answers)}.
Selecciona el curso más idóneo y responde ÚNICAMENTE en JSON con formato:
{
  "selectedCourseId": string,
  "courseTitle": string,
  "recommendedLessonId": string,
  "pathTitle": string,
  "reason": string
}`;

      aiRecommendation = await this.geminiService.generateJson(prompt, fallbackGenerator);
    }

    // Persistir la LearningPath adaptativa en base de datos
    const targetCourse = courses.find((c) => c.id === aiRecommendation.selectedCourseId) || defaultCourse;
    const targetLessonId =
      aiRecommendation.recommendedLessonId || targetCourse?.modules[0]?.lessons[0]?.id;

    let learningPathId = 'path-demo';
    if (targetCourse) {
      const learningPath = await this.prisma.learningPath.create({
        data: {
          userId,
          title: aiRecommendation.pathTitle,
          nodes: {
            create: targetCourse.modules.flatMap((m, mIdx) =>
              m.lessons.map((l, lIdx) => ({
                moduleId: m.id,
                lessonId: l.id,
                order: mIdx * 10 + lIdx + 1,
                reason: l.id === targetLessonId ? 'Punto de inicio recomendado' : 'Contenido complementario',
              })),
            ),
          },
        },
      });
      learningPathId = learningPath.id;

      // Inscribir automáticamente al alumno sin costo
      await this.prisma.enrollment.upsert({
        where: {
          userId_courseId: {
            userId,
            courseId: targetCourse.id,
          },
        },
        update: {},
        create: {
          userId,
          courseId: targetCourse.id,
        },
      });
    }

    return {
      courseId: targetCourse?.id || 'demo-course',
      courseTitle: targetCourse?.title || 'Desarrollo Web Fullstack',
      lessonId: targetLessonId,
      redirectUrl: `/lessons/${targetLessonId}`,
      learningPathId,
      actionButton: {
        label: 'Comenzar Primera Lección',
        url: `/lessons/${targetLessonId}`,
        color: 'sky',
      },
    };
  }
}
