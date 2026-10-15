// backend/test/tutor.e2e-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/common/prisma/prisma.service';
import { GlobalHttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { Role } from '@prisma/client';
import { JwtService } from '@nestjs/jwt';

describe('Módulo 02: Evaluación con Docente Virtual Humanoide & Google Gemini (BDD E2E)', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let studentToken: string;

  const studentId = '00000000-0000-4000-8000-000000000030';
  const moduleId = 'a0000000-0000-4000-8000-000000000001';
  const emptyModuleId = 'b0000000-0000-4000-8000-000000000002';
  const courseId = 'c0000000-0000-4000-8000-000000000002';

  const mockLessons = [
    {
      id: 'd0000000-0000-4000-8000-000000000001',
      moduleId,
      title: 'Lección 1: Variables y Tipos de Datos',
      videoUrl: 'https://www.youtube.com/watch?v=mock1',
      contextText: 'En esta clase explicamos qué es una variable y cómo se asigna memoria en tiempo de ejecución.',
      order: 1,
    },
    {
      id: 'd0000000-0000-4000-8000-000000000002',
      moduleId,
      title: 'Lección 2: Estructuras de Control y Bucles',
      videoUrl: 'https://www.youtube.com/watch?v=mock2',
      contextText: 'Analizamos condicionales if-else y ciclos while y for para iterar datos.',
      order: 2,
    },
  ];

  const attemptsDb: any[] = [];
  const modularExamId = 'e0000000-0000-4000-8000-000000000001';

  const mockPrisma = {
    module: {
      findUnique: jest.fn().mockImplementation(({ where }) => {
        if (where.id === moduleId) {
          return Promise.resolve({
            id: moduleId,
            courseId,
            title: 'Módulo 1: Fundamentos de Programación',
            order: 1,
            course: { id: courseId, title: 'Curso de JavaScript Moderno' },
            lessons: mockLessons,
          });
        }
        if (where.id === emptyModuleId) {
          return Promise.resolve({
            id: emptyModuleId,
            courseId,
            title: 'Módulo 2: Sin Contenidos',
            order: 2,
            course: { id: courseId, title: 'Curso de JavaScript Moderno' },
            lessons: [],
          });
        }
        return Promise.resolve(null);
      }),
    },
    exam: {
      findFirst: jest.fn().mockImplementation(({ where }) => {
        if (where.moduleId === moduleId) {
          return Promise.resolve({
            id: modularExamId,
            moduleId,
            title: 'Evaluación con Docente Virtual - Módulo 1',
            passScore: 70.0,
          });
        }
        return Promise.resolve(null);
      }),
      create: jest.fn().mockImplementation(({ data }) => {
        return Promise.resolve({
          id: modularExamId,
          ...data,
        });
      }),
    },
    examAttempt: {
      create: jest.fn().mockImplementation(({ data }) => {
        const attempt = {
          id: `attempt-${Date.now()}`,
          ...data,
          createdAt: new Date(),
        };
        attemptsDb.push(attempt);
        return Promise.resolve(attempt);
      }),
    },
    user: {
      findUnique: jest.fn().mockResolvedValue({
        id: studentId,
        email: 'student.eval@univalle.edu',
        role: Role.STUDENT,
        credits: 0, // Invariante: 0 créditos para verificar que no requiere saldo
      }),
    },
  };

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrisma)
      .compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    app.useGlobalFilters(new GlobalHttpExceptionFilter());
    await app.init();

    jwtService = moduleRef.get<JwtService>(JwtService);
    studentToken = jwtService.sign({
      sub: studentId,
      email: 'student.eval@univalle.edu',
      role: Role.STUDENT,
    });
  }, 10000);

  afterAll(async () => {
    await app.close();
  });

  // HU-04 & SC-04.1
  it('SC-04.1: POST /tutor/test-connection debe retornar frase dinámica de Gemini y visemas en tiempo real (Fail-Fast: 5s)', async () => {
    const res = await request(app.getHttpServer())
      .post('/tutor/test-connection')
      .send({ demoMode: true })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.provider).toBe('Google Gemini');
    expect(res.body.phrase).toBeDefined();
    expect(res.body.phrase.length).toBeGreaterThan(10);
    expect(res.body.timestamp).toBeDefined();
    expect(Array.isArray(res.body.visemes)).toBe(true);
    expect(res.body.visemes.length).toBeGreaterThan(0);
  }, 5000);

  // HU-01 & SC-01.2
  it('SC-01.2: GET /tutor/module-evaluation/context/:moduleId debe entregar contexto recopilado para auditoría en modal (Fail-Fast: 5s)', async () => {
    const res = await request(app.getHttpServer())
      .get(`/tutor/module-evaluation/context/${moduleId}`)
      .set('Authorization', `Bearer ${studentToken}`)
      .expect(200);

    expect(res.body.moduleId).toBe(moduleId);
    expect(res.body.moduleTitle).toContain('Fundamentos');
    expect(res.body.totalLessons).toBe(2);
    expect(Array.isArray(res.body.lessons)).toBe(true);
    expect(res.body.lessons[0].contextText).toContain('variable');
  }, 5000);

  // HU-01 & SC-01.1 & SC-03.1
  it('SC-01.1 & SC-03.1: POST /tutor/module-evaluation/start debe iniciar con la pregunta de la lección 1 sin descontar créditos (Fail-Fast: 5s)', async () => {
    const res = await request(app.getHttpServer())
      .post('/tutor/module-evaluation/start')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ moduleId })
      .expect(200);

    expect(res.body.moduleId).toBe(moduleId);
    expect(res.body.totalLessons).toBe(2);
    expect(res.body.currentLessonIndex).toBe(0);
    expect(res.body.currentLessonTitle).toBe('Lección 1: Variables y Tipos de Datos');
    expect(res.body.questionText).toBeDefined();
    expect(Array.isArray(res.body.visemes)).toBe(true);
    expect(res.body.collectedContext.lessons.length).toBe(2);
  }, 5000);

  // HU-03 & SC-02.1 & SC-03.1
  it('SC-03.1: POST /tutor/module-evaluation/answer debe evaluar Lección 1, retroalimentar con postura y entregar pregunta de Lección 2 (Fail-Fast: 5s)', async () => {
    const res = await request(app.getHttpServer())
      .post('/tutor/module-evaluation/answer')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        moduleId,
        lessonIndex: 0,
        userResponse: 'Una variable es un espacio reservado en memoria para guardar un valor que puede cambiar.',
      })
      .expect(200);

    expect(res.body.feedbackText).toBeDefined();
    expect(['explaining', 'celebrating', 'encouraging']).toContain(res.body.avatarEmotion);
    expect(res.body.hasNextLesson).toBe(true);
    expect(res.body.nextQuestion).toBeDefined();
    expect(res.body.nextQuestion.lessonIndex).toBe(1);
    expect(res.body.nextQuestion.lessonTitle).toBe('Lección 2: Estructuras de Control y Bucles');
  }, 5000);

  // HU-03 & SC-03.1
  it('SC-03.1: POST /tutor/module-evaluation/answer en última lección debe persistir ExamAttempt y dictamen final (Fail-Fast: 5s)', async () => {
    const initialAttemptsCount = attemptsDb.length;

    const res = await request(app.getHttpServer())
      .post('/tutor/module-evaluation/answer')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        moduleId,
        lessonIndex: 1,
        userResponse: 'Los bucles for y while nos permiten repetir instrucciones mientras se cumpla una condición.',
      })
      .expect(200);

    expect(res.body.hasNextLesson).toBe(false);
    expect(res.body.finalSummary).toBeDefined();
    expect(res.body.finalSummary.approved).toBe(true);
    expect(res.body.finalSummary.scorePercentage).toBeGreaterThanOrEqual(70);
    expect(res.body.finalSummary.closingRemarks).toContain('Felicitaciones');

    // Comprobar persistencia física en ExamAttempt
    expect(attemptsDb.length).toBe(initialAttemptsCount + 1);
    const lastAttempt = attemptsDb[attemptsDb.length - 1];
    expect(lastAttempt.userId).toBe(studentId);
    expect(lastAttempt.examId).toBe(modularExamId);
  }, 5000);

  // SC-01.3: Catálogo vacío / Módulo sin lecciones
  it('SC-01.3: POST /tutor/module-evaluation/start con módulo sin lecciones debe retornar 400 Bad Request controlado (Fail-Fast: 5s)', async () => {
    const res = await request(app.getHttpServer())
      .post('/tutor/module-evaluation/start')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ moduleId: emptyModuleId })
      .expect(400);

    expect(res.body.detail).toContain('no posee lecciones');
  }, 5000);

  // Manejo de Error: Módulo inexistente
  it('Módulo no encontrado debe retornar 404 Not Found (Fail-Fast: 5s)', async () => {
    const nonExistentId = '00000000-0000-4000-8000-999999999999';
    await request(app.getHttpServer())
      .post('/tutor/module-evaluation/start')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ moduleId: nonExistentId })
      .expect(404);
  }, 5000);
});
