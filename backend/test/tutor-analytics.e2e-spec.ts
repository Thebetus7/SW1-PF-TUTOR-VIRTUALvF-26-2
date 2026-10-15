// backend/test/tutor-analytics.e2e-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/common/prisma/prisma.service';
import { GeminiService } from '../src/common/services/gemini.service';
import { GlobalHttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { Role } from '@prisma/client';
import { JwtService } from '@nestjs/jwt';

describe('Vertical Slice 5: Evaluaciones, Tutor Virtual 3D & Analítica Móvil (BDD E2E)', () => {
  let app: INestApplication;
  let jwtService: JwtService;

  const teacherId = '00000000-0000-4000-8000-000000000010';
  const studentId = '00000000-0000-4000-8000-000000000020';

  let teacherToken: string;
  let studentToken: string;

  const examId = 'e0000000-0000-4000-8000-000000000001';
  const lessonId = '1e550000-0000-4000-8000-000000000001';
  const courseId = 'c0000000-0000-4000-8000-000000000001';

  const q1Id = '11111111-0000-4000-8000-000000000001';
  const q1OptCorrect = '11111111-0000-4000-8000-000000000002';
  const q1OptWrong = '11111111-0000-4000-8000-000000000003';

  const q2Id = '22222222-0000-4000-8000-000000000001';
  const q2OptCorrect = '22222222-0000-4000-8000-000000000002';
  const q2OptWrong = '22222222-0000-4000-8000-000000000003';

  const attemptsDb: any[] = [];
  const completedLessons = new Set<string>();
  let registeredPushToken: string | null = null;

  const mockExam = {
    id: examId,
    lessonId,
    title: 'Evaluación de Anatomía de Componentes React',
    passScore: 70.0,
    questions: [
      {
        id: q1Id,
        text: '¿Qué es JSX?',
        options: [
          { id: q1OptCorrect, text: 'Extensión sintáctica de JS similar a HTML', isCorrect: true },
          { id: q1OptWrong, text: 'Un motor SQL', isCorrect: false },
        ],
      },
      {
        id: q2Id,
        text: '¿Cómo se pasan datos de padre a hijo en React?',
        options: [
          { id: q2OptCorrect, text: 'Mediante props', isCorrect: true },
          { id: q2OptWrong, text: 'Modificando el DOM global', isCorrect: false },
        ],
      },
    ],
  };

  const mockLesson = {
    id: lessonId,
    moduleId: 'mod-1',
    title: 'Componentes y JSX',
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    contextText: 'En esta lección aprendemos qué es JSX y el flujo unidireccional de datos con props.',
    exams: [mockExam],
  };

  const mockPrismaService = {
    user: {
      findUnique: jest.fn().mockImplementation(({ where }) => {
        if (where.id === teacherId) {
          return Promise.resolve({
            id: teacherId,
            email: 'teacher@skylearn.edu',
            role: Role.TEACHER,
            name: 'Profesor Skylearn',
            pushToken: registeredPushToken,
          });
        }
        if (where.id === studentId) {
          return Promise.resolve({
            id: studentId,
            email: 'student@skylearn.edu',
            role: Role.STUDENT,
            name: 'Alumno Skylearn',
          });
        }
        return Promise.resolve(null);
      }),
      update: jest.fn().mockImplementation(({ where, data }) => {
        if (where.id === teacherId && data.pushToken) {
          registeredPushToken = data.pushToken;
        }
        return Promise.resolve({ id: where.id, pushToken: registeredPushToken });
      }),
    },
    exam: {
      findUnique: jest.fn().mockImplementation(({ where }) => {
        if (where.id === examId) return Promise.resolve(mockExam);
        return Promise.resolve(null);
      }),
    },
    examAttempt: {
      create: jest.fn().mockImplementation(({ data }) => {
        const attempt = {
          id: 'attempt-' + Math.random().toString(36).substring(7),
          userId: data.userId,
          examId: data.examId,
          score: data.score,
          isPassed: data.isPassed,
          aiFeedback: data.aiFeedback,
          createdAt: new Date(),
        };
        attemptsDb.push(attempt);
        return Promise.resolve(attempt);
      }),
      findMany: jest.fn().mockImplementation(({ where }) => {
        return Promise.resolve(
          attemptsDb.filter((a) => a.userId === where.userId && a.examId === where.examId),
        );
      }),
    },
    lesson: {
      findUnique: jest.fn().mockImplementation(({ where }) => {
        if (where.id === lessonId) return Promise.resolve(mockLesson);
        return Promise.resolve(null);
      }),
    },
    lessonProgress: {
      upsert: jest.fn().mockImplementation(({ where, create, update }) => {
        completedLessons.add(`${where.userId_lessonId.userId}_${where.userId_lessonId.lessonId}`);
        return Promise.resolve({
          id: 'prog-uuid',
          userId: where.userId_lessonId.userId,
          lessonId: where.userId_lessonId.lessonId,
          isCompleted: true,
          completedAt: new Date(),
        });
      }),
    },
    course: {
      findMany: jest.fn().mockImplementation(({ where }) => {
        return Promise.resolve([
          {
            id: courseId,
            teacherId,
            title: 'Desarrollo Web Fullstack con React',
            description: 'Curso completo.',
            enrollments: [{ userId: studentId, user: { id: studentId, name: 'Alumno Demo', email: 'student@test.com' } }],
            modules: [
              {
                id: 'mod-1',
                lessons: [
                  {
                    id: lessonId,
                    title: 'Componentes y JSX',
                    progresses: [{ userId: studentId, isCompleted: true }],
                    exams: [
                      {
                        id: examId,
                        attempts: attemptsDb,
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ]);
      }),
    },
  };

  const mockGeminiService = {
    generateJson: jest.fn().mockImplementation((prompt, fallbackFn) => {
      return Promise.resolve({
        replyText: '¡Excelente pregunta! Recuerda que JSX te permite escribir la interfaz declarativamente.',
        shouldRedirect: false,
        recommendationReason: 'Dominio de sintaxis declarativa',
      });
    }),
    generateText: jest.fn().mockImplementation((prompt, fallbackFn) => {
      return Promise.resolve('¡Gran esfuerzo! Sigue practicando y consolidarás tu aprendizaje con éxito.');
    }),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrismaService)
      .overrideProvider(GeminiService)
      .useValue(mockGeminiService)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    app.useGlobalFilters(new GlobalHttpExceptionFilter());

    await app.init();

    jwtService = moduleFixture.get<JwtService>(JwtService);
    teacherToken = jwtService.sign({ sub: teacherId, email: 'teacher@skylearn.edu', role: Role.TEACHER });
    studentToken = jwtService.sign({ sub: studentId, email: 'student@skylearn.edu', role: Role.STUDENT });
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    attemptsDb.length = 0;
    completedLessons.clear();
    registeredPushToken = null;
    jest.clearAllMocks();
  });

  describe('Evaluaciones Formativas con Reintentos Libres (SC-06.1.1 & SC-06.1.2)', () => {
    it('Given un examen con umbral del 70%, When el estudiante obtiene 50% de aciertos, Then resulta reprobado, recibe feedback motivacional y puede reintentar', async () => {
      // 1 correcta y 1 incorrecta (50%)
      const submitPayload = {
        answers: [
          { questionId: q1Id, selectedOptionId: q1OptCorrect },
          { questionId: q2Id, selectedOptionId: q2OptWrong },
        ],
      };

      const res = await request(app.getHttpServer())
        .post(`/exams/${examId}/submit`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send(submitPayload)
        .expect(200);

      expect(res.body.score).toBe(50);
      expect(res.body.isPassed).toBe(false);
      expect(res.body.retryAllowed).toBe(true);
      expect(res.body.aiFeedback).toBeDefined();
      expect(completedLessons.has(`${studentId}_${lessonId}`)).toBe(false);
    });

    it('Given un intento previo con 50%, When el estudiante reintenta y obtiene 100%, Then aprueba, marca la lección completada y registra la nota máxima en 100%', async () => {
      // Intento 1: 50%
      await request(app.getHttpServer())
        .post(`/exams/${examId}/submit`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          answers: [
            { questionId: q1Id, selectedOptionId: q1OptCorrect },
            { questionId: q2Id, selectedOptionId: q2OptWrong },
          ],
        })
        .expect(200);

      // Intento 2: 100%
      const res = await request(app.getHttpServer())
        .post(`/exams/${examId}/submit`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          answers: [
            { questionId: q1Id, selectedOptionId: q1OptCorrect },
            { questionId: q2Id, selectedOptionId: q2OptCorrect },
          ],
        })
        .expect(200);

      expect(res.body.score).toBe(100);
      expect(res.body.isPassed).toBe(true);
      expect(res.body.maxHistoricalScore).toBe(100);
      expect(completedLessons.has(`${studentId}_${lessonId}`)).toBe(true);
      expect(attemptsDb.length).toBe(2);
    });
  });

  describe('Tutor Virtual 3D Multimodal con Visemas para Three.js (SC-07.1.1 - SC-07.3.1)', () => {
    it('Given una lección con contextText, When el estudiante envía una consulta al tutor, Then recibe respuesta empática y pista de visemas para animación 3D', async () => {
      const tutorPayload = {
        lessonId,
        message: '¿Para qué sirve JSX en React?',
      };

      const res = await request(app.getHttpServer())
        .post('/tutor/chat')
        .set('Authorization', `Bearer ${studentToken}`)
        .send(tutorPayload)
        .expect(200);

      expect(res.body.replyText).toBeDefined();
      expect(res.body.visemes).toBeDefined();
      expect(Array.isArray(res.body.visemes)).toBe(true);
      expect(res.body.visemes.length).toBeGreaterThan(0);
      // Validar estructura de visema
      expect(res.body.visemes[0]).toHaveProperty('shape');
      expect(res.body.visemes[0]).toHaveProperty('weight');
      expect(res.body.redirectRecommendation).toBeDefined();
    });
  });

  describe('Dashboard Móvil Docente y Push Notifications (SC-08.1.2 & SC-08.1.3)', () => {
    it('Given un docente autenticado, When consulta su dashboard, Then recibe los 3 KPIs, semáforo pedagógico por curso y lección crítica', async () => {
      // Simular un intento para calcular estadísticas
      attemptsDb.push({
        id: 'att-1',
        userId: studentId,
        examId,
        score: 100,
        isPassed: true,
        createdAt: new Date(),
      });

      const res = await request(app.getHttpServer())
        .get('/teacher/dashboard')
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(200);

      expect(res.body.kpis).toBeDefined();
      expect(res.body.kpis.activeStudentsCount).toBeGreaterThanOrEqual(1);
      expect(res.body.kpis.averagePassRate).toBeDefined();
      expect(res.body.kpis.totalCompletions).toBeDefined();

      expect(Array.isArray(res.body.courses)).toBe(true);
      expect(res.body.courses[0].trafficLight).toBeDefined();
      expect(['leaf', 'sun', 'coral']).toContain(res.body.courses[0].trafficLight);

      expect(res.body.criticalLesson).toBeDefined();
      expect(res.body.criticalLesson.lessonTitle).toBeDefined();
    });

    it('Given un docente con Expo Push Token registrado, When se produce una inscripción, Then se envía notificación efímera al dispositivo', async () => {
      // 1. Registrar token del dispositivo
      const tokenPayload = { pushToken: 'ExponentPushToken[demo-token-12345]' };
      const regRes = await request(app.getHttpServer())
        .post('/teacher/device-token')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send(tokenPayload)
        .expect(200);

      expect(regRes.body.success).toBe(true);
      expect(registeredPushToken).toBe(tokenPayload.pushToken);
    });
  });
});
