// backend/test/tutor-simulation.e2e-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/common/prisma/prisma.service';
import { GlobalHttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { Role } from '@prisma/client';
import { JwtService } from '@nestjs/jwt';

describe('Slice 1 BDD: Modo Simulación del Tutor Virtual e Inmunidad Analítica (E2E)', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let studentToken: string;
  let teacherToken: string;

  const studentId = '00000000-0000-4000-8000-000000000050';
  const teacherId = '00000000-0000-4000-8000-000000000051';
  const moduleId = 'a0000000-0000-4000-8000-000000000088';
  const courseId = 'c0000000-0000-4000-8000-000000000088';
  const examId = 'e0000000-0000-4000-8000-000000000088';

  const mockLesson = {
    id: 'd0000000-0000-4000-8000-000000000088',
    moduleId,
    title: 'Lección Única: Algoritmos',
    videoUrl: 'https://www.youtube.com/watch?v=mockSim',
    contextText: 'Conceptos clave de algoritmos y optimización.',
    order: 1,
  };

  const attemptsCreated: any[] = [];

  const mockPrisma = {
    user: {
      findUnique: jest.fn().mockImplementation(({ where }) => {
        if (where.id === studentId) {
          return Promise.resolve({
            id: studentId,
            email: 'alumno.sim@univalle.edu',
            name: 'Alumno Simulación',
            role: Role.STUDENT,
          });
        }
        if (where.id === teacherId) {
          return Promise.resolve({
            id: teacherId,
            email: 'docente.sim@univalle.edu',
            name: 'Docente Simulación',
            role: Role.TEACHER,
          });
        }
        return Promise.resolve(null);
      }),
    },
    module: {
      findUnique: jest.fn().mockImplementation(({ where }) => {
        if (where.id === moduleId) {
          return Promise.resolve({
            id: moduleId,
            courseId,
            title: 'Módulo de Prueba Algoritmos',
            order: 1,
            lessons: [mockLesson],
          });
        }
        return Promise.resolve(null);
      }),
    },
    exam: {
      findFirst: jest.fn().mockImplementation(({ where }) => {
        if (where.moduleId === moduleId) {
          return Promise.resolve({
            id: examId,
            moduleId,
            title: 'Examen Modular',
            passScore: 70.0,
          });
        }
        return Promise.resolve(null);
      }),
    },
    examAttempt: {
      create: jest.fn().mockImplementation(({ data }) => {
        attemptsCreated.push(data);
        return Promise.resolve({
          id: 'attempt-uuid-' + (attemptsCreated.length),
          ...data,
          createdAt: new Date(),
        });
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
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    app.useGlobalFilters(new GlobalHttpExceptionFilter());
    await app.init();

    jwtService = moduleRef.get<JwtService>(JwtService);

    studentToken = jwtService.sign({
      sub: studentId,
      email: 'alumno.sim@univalle.edu',
      role: Role.STUDENT,
    });

    teacherToken = jwtService.sign({
      sub: teacherId,
      email: 'docente.sim@univalle.edu',
      role: Role.TEACHER,
    });
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    attemptsCreated.length = 0;
    mockPrisma.examAttempt.create.mockClear();
  });

  it('Escenario 1 (Docente en Simulación): Al finalizar evaluación con isSimulation: true NO se crea ExamAttempt', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/tutor/module-evaluation/answer')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({
        moduleId,
        lessonIndex: 0,
        userResponse: 'Un algoritmo es un conjunto de pasos ordenados y finitos para resolver un problema.',
        isSimulation: true,
      });

    expect(res.status).toBe(200);
    expect(res.body.isCorrect).toBe(true);
    expect(res.body.isSimulation).toBe(true);
    expect(res.body.visemes).toBeDefined();
    expect(res.body.finalSummary).toBeDefined();
    expect(res.body.finalSummary.isSimulation).toBe(true);
    expect(res.body.finalSummary.attemptId).toBeUndefined();

    // Verificación empírica: base de datos libre de notas de prueba
    expect(mockPrisma.examAttempt.create).not.toHaveBeenCalled();
    expect(attemptsCreated.length).toBe(0);
  });

  it('Escenario 2 (Estudiante Formal): Al finalizar evaluación sin isSimulation SÍ se persiste ExamAttempt', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/tutor/module-evaluation/answer')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        moduleId,
        lessonIndex: 0,
        userResponse: 'Los algoritmos ordenan instrucciones para procesar datos eficientemente.',
        isSimulation: false,
      });

    expect(res.status).toBe(200);
    expect(res.body.isCorrect).toBe(true);
    expect(res.body.isSimulation).toBe(false);
    expect(res.body.finalSummary).toBeDefined();
    expect(res.body.finalSummary.isSimulation).toBe(false);
    expect(res.body.finalSummary.attemptId).toBeDefined();

    // Verificación empírica: se persiste el intento formal del alumno
    expect(mockPrisma.examAttempt.create).toHaveBeenCalledTimes(1);
    expect(attemptsCreated.length).toBe(1);
  });
});
