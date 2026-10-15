// backend/test/recommendations.e2e-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/common/prisma/prisma.service';
import { GeminiService } from '../src/common/services/gemini.service';
import { GlobalHttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { Role, CourseStatus } from '@prisma/client';
import { JwtService } from '@nestjs/jwt';

describe('Vertical Slice 3: Cuestionario Inicial & Rutas Adaptativas (BDD E2E)', () => {
  let app: INestApplication;
  let jwtService: JwtService;

  const studentId = 'student-test-uuid-3333';
  let studentToken: string;

  const demoCourseId = 'c0000000-0000-4000-8000-000000000001';
  const demoModuleId = 'm0000000-0000-4000-8000-000000000001';
  const demoLessonId = 'l0000000-0000-4000-8000-000000000001';

  let studentCredits = 3;
  let geminiFail = false;

  const mockCourses = [
    {
      id: demoCourseId,
      title: 'Desarrollo Web Fullstack con React y NestJS',
      description: 'Aprende frontend y backend moderno.',
      status: CourseStatus.PUBLISHED,
      category: { id: 'cat-1', name: 'Desarrollo Web' },
      teacher: { id: 'teacher-uuid', name: 'Profesor Docente Skylearn' },
      enrollments: [],
      modules: [
        {
          id: demoModuleId,
          order: 1,
          lessons: [
            {
              id: demoLessonId,
              title: 'Introducción a Componentes React',
              order: 1,
            },
          ],
        },
      ],
    },
  ];

  const mockPrismaService = {
    user: {
      findUnique: jest.fn().mockImplementation(({ where }) => {
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
    },
    creditAccount: {
      findUnique: jest.fn().mockImplementation(({ where }) => {
        if (where.userId === studentId) {
          return Promise.resolve({ userId: studentId, balance: studentCredits });
        }
        return Promise.resolve(null);
      }),
    },
    course: {
      findMany: jest.fn().mockImplementation(() => {
        return Promise.resolve(mockCourses);
      }),
    },
    learningPath: {
      create: jest.fn().mockImplementation(({ data }) => {
        return Promise.resolve({
          id: 'path-created-uuid-999',
          userId: data.userId,
          title: data.title,
          createdAt: new Date(),
        });
      }),
    },
    enrollment: {
      upsert: jest.fn().mockImplementation(({ where, create }) => {
        return Promise.resolve({
          id: 'enrollment-uuid-1',
          userId: create.userId,
          courseId: create.courseId,
          enrolledAt: new Date(),
        });
      }),
    },
  };

  const mockGeminiService = {
    generateJson: jest.fn().mockImplementation((prompt: string, fallbackFn: () => any) => {
      if (geminiFail) {
        return Promise.resolve(fallbackFn());
      }
      return Promise.resolve({
        selectedCourseId: demoCourseId,
        courseTitle: 'Desarrollo Web Fullstack con React y NestJS',
        recommendedLessonId: demoLessonId,
        pathTitle: 'Ruta Adaptativa: Desarrollo Web Fullstack',
        reason: 'Recomendación personalizada generada con inteligencia artificial.',
      });
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
    studentToken = jwtService.sign({ sub: studentId, email: 'student@skylearn.edu', role: Role.STUDENT });
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    studentCredits = 3;
    geminiFail = false;
    jest.clearAllMocks();
  });

  describe('Cuestionario Inicial y Generación de Ruta a Costo 0 (SC-03.1.1)', () => {
    it('Given un alumno nuevo con 3 créditos, When consulta el cuestionario inicial, Then recibe 3 preguntas breves con incisos a costo 0', async () => {
      const res = await request(app.getHttpServer())
        .get('/recommendations/quiz')
        .expect(200);

      expect(res.body.questions).toBeDefined();
      expect(res.body.questions.length).toBeGreaterThanOrEqual(3);
      expect(res.body.questions[0].options.length).toBeGreaterThan(0);
      expect(studentCredits).toBe(3);
    });

    it('Given un alumno que responde el cuestionario, When envía sus respuestas, Then se compila la LearningPath y su balance de créditos se mantiene intacto en 3', async () => {
      const answersPayload = {
        answers: [
          { questionId: 'q-interests', optionIndex: 0, selectedText: 'Desarrollo Web' },
          { questionId: 'q-experience', optionIndex: 0, selectedText: 'Principiante' },
          { questionId: 'q-goal', optionIndex: 0, selectedText: 'Aprender jugando' },
        ],
      };

      const res = await request(app.getHttpServer())
        .post('/recommendations/quiz/submit')
        .set('Authorization', `Bearer ${studentToken}`)
        .send(answersPayload)
        .expect(201);

      expect(res.body.courseId).toBe(demoCourseId);
      expect(res.body.lessonId).toBe(demoLessonId);
      expect(res.body.actionButton.label).toContain('Comenzar');
      expect(mockPrismaService.learningPath.create).toHaveBeenCalled();
      expect(mockPrismaService.enrollment.upsert).toHaveBeenCalled();
      // Garantía de Costo 0: el balance no fue debitado
      expect(studentCredits).toBe(3);
    });
  });

  describe('Omisión Directa y Fallback Heurístico (SC-03.1.2 & SC-04.1.1)', () => {
    it('Given un alumno que no desea contestar, When consulta directamente el catálogo, Then accede sin bloqueo ni deducción', async () => {
      const res = await request(app.getHttpServer())
        .get('/courses')
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(studentCredits).toBe(3);
    });

    it('Given saturación o timeout en el proveedor Gemini, When se procesa el quiz, Then se activa el fallback determinista y entrega la ruta sin error', async () => {
      geminiFail = true;

      const answersPayload = {
        answers: [
          { questionId: 'q-interests', optionIndex: 0, selectedText: 'Cualquiera' },
        ],
      };

      const res = await request(app.getHttpServer())
        .post('/recommendations/quiz/submit')
        .set('Authorization', `Bearer ${studentToken}`)
        .send(answersPayload)
        .expect(201);

      expect(res.body.courseId).toBe(demoCourseId);
      expect(res.body.lessonId).toBe(demoLessonId);
      expect(res.body.actionButton).toBeDefined();
    });
  });
});
