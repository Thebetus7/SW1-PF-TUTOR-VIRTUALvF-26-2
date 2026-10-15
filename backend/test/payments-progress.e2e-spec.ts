// backend/test/payments-progress.e2e-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/common/prisma/prisma.service';
import { GlobalHttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { Role, SubscriptionStatus } from '@prisma/client';
import { JwtService } from '@nestjs/jwt';

describe('Vertical Slice 4: Desbloqueo Permanente, Paywall & Stripe Developer Mode (BDD E2E)', () => {
  let app: INestApplication;
  let jwtService: JwtService;

  const studentId = '00000000-0000-4000-8000-000000000001';
  let studentToken: string;

  const lessonAId = 'a0000000-0000-4000-8000-000000000101';
  const lessonBId = 'b0000000-0000-4000-8000-000000000102';

  // Base de datos en memoria para simular el comportamiento de persistencia
  let creditBalance = 3;
  let userSubscriptionStatus: SubscriptionStatus = SubscriptionStatus.INACTIVE;
  const unlockedLessons = new Set<string>();
  const completedLessons = new Set<string>();
  const processedWebhooks = new Set<string>();

  const mockLessonA = {
    id: lessonAId,
    moduleId: 'mod-1',
    title: 'Lección A: Componentes React',
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    contextText: 'Contexto de prueba de la lección A',
    downloadableUrl: 'https://skylearn.edu/guide.pdf',
    order: 1,
    module: { course: { id: 'course-1', title: 'React Pro', teacherId: 'teacher-1' } },
    exams: [],
  };

  const mockLessonB = {
    id: lessonBId,
    moduleId: 'mod-1',
    title: 'Lección B: Hooks y Estado',
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    contextText: 'Contexto de prueba de la lección B',
    downloadableUrl: 'https://skylearn.edu/guide.pdf',
    order: 2,
    module: { course: { id: 'course-1', title: 'React Pro', teacherId: 'teacher-1' } },
    exams: [],
  };

  const mockPrismaService = {
    user: {
      findUnique: jest.fn().mockImplementation(({ where }) => {
        if (where.id === studentId) {
          return Promise.resolve({
            id: studentId,
            email: 'student@skylearn.edu',
            role: Role.STUDENT,
            name: 'Alumno Demo',
          });
        }
        return Promise.resolve(null);
      }),
    },
    creditAccount: {
      findUnique: jest.fn().mockImplementation(({ where }) => {
        if (where.userId === studentId) {
          return Promise.resolve({ userId: studentId, balance: creditBalance });
        }
        return Promise.resolve(null);
      }),
      update: jest.fn().mockImplementation(({ where, data }) => {
        if (data.balance?.decrement) {
          creditBalance -= data.balance.decrement;
        }
        return Promise.resolve({ userId: studentId, balance: creditBalance });
      }),
    },
    subscription: {
      findUnique: jest.fn().mockImplementation(({ where }) => {
        if (where.userId === studentId) {
          return Promise.resolve({
            userId: studentId,
            status: userSubscriptionStatus,
          });
        }
        return Promise.resolve(null);
      }),
      upsert: jest.fn().mockImplementation(({ where, update, create }) => {
        userSubscriptionStatus = update?.status || create?.status || SubscriptionStatus.ACTIVE;
        return Promise.resolve({
          userId: where.userId,
          status: userSubscriptionStatus,
        });
      }),
    },
    lesson: {
      findUnique: jest.fn().mockImplementation(({ where }) => {
        if (where.id === lessonAId) return Promise.resolve(mockLessonA);
        if (where.id === lessonBId) return Promise.resolve(mockLessonB);
        return Promise.resolve(null);
      }),
    },
    lessonUnlock: {
      findUnique: jest.fn().mockImplementation(({ where }) => {
        const key = `${where.userId_lessonId.userId}_${where.userId_lessonId.lessonId}`;
        if (unlockedLessons.has(key)) {
          return Promise.resolve({ userId: studentId, lessonId: where.userId_lessonId.lessonId });
        }
        return Promise.resolve(null);
      }),
      create: jest.fn().mockImplementation(({ data }) => {
        const key = `${data.userId}_${data.lessonId}`;
        unlockedLessons.add(key);
        return Promise.resolve({ id: 'unlock-uuid', userId: data.userId, lessonId: data.lessonId });
      }),
    },
    lessonProgress: {
      upsert: jest.fn().mockImplementation(({ where, update, create }) => {
        const key = `${where.userId_lessonId.userId}_${where.userId_lessonId.lessonId}`;
        completedLessons.add(key);
        return Promise.resolve({
          id: 'prog-uuid',
          userId: where.userId_lessonId.userId,
          lessonId: where.userId_lessonId.lessonId,
          isCompleted: true,
          completedAt: new Date(),
        });
      }),
    },
    processedWebhookEvent: {
      findUnique: jest.fn().mockImplementation(({ where }) => {
        if (processedWebhooks.has(where.id)) {
          return Promise.resolve({ id: where.id, processedAt: new Date() });
        }
        return Promise.resolve(null);
      }),
      create: jest.fn().mockImplementation(({ data }) => {
        processedWebhooks.add(data.id);
        return Promise.resolve({ id: data.id, processedAt: new Date() });
      }),
    },
    $transaction: jest.fn().mockImplementation((promisesOrFn) => {
      if (typeof promisesOrFn === 'function') {
        return promisesOrFn(mockPrismaService);
      }
      return Promise.all(promisesOrFn);
    }),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrismaService)
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
    creditBalance = 3;
    userSubscriptionStatus = SubscriptionStatus.INACTIVE;
    unlockedLessons.clear();
    completedLessons.clear();
    processedWebhooks.clear();
    jest.clearAllMocks();
  });

  describe('Deducción Inicial y Reapertura Gratuita Permanente (SC-05.1.1)', () => {
    it('Given un alumno con 3 créditos, When accede por primera vez a una lección, Then se debita 1 crédito (quedando 2) y se desbloquea', async () => {
      const res = await request(app.getHttpServer())
        .post(`/lessons/${lessonAId}/access`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(res.body.creditDebited).toBe(true);
      expect(res.body.isPermanentUnlock).toBe(true);
      expect(res.body.remainingCredits).toBe(2);
      expect(creditBalance).toBe(2);
    });

    it('Given una lección previamente desbloqueada, When el alumno la vuelve a abrir, Then se concede acceso sin descontar créditos adicionales', async () => {
      // Primer acceso: 3 -> 2
      await request(app.getHttpServer())
        .post(`/lessons/${lessonAId}/access`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(creditBalance).toBe(2);

      // Segundo acceso a la misma lección: sin costo
      const res = await request(app.getHttpServer())
        .post(`/lessons/${lessonAId}/access`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(res.body.creditDebited).toBe(false);
      expect(res.body.isPermanentUnlock).toBe(true);
      expect(res.body.remainingCredits).toBe(2);
      expect(creditBalance).toBe(2);
    });
  });

  describe('Paywall Interactivo cuando Saldo = 0 (SC-05.1.2)', () => {
    it('Given un alumno con saldo 0 sin suscripción activa, When intenta acceder a una nueva lección, Then recibe HTTP 402 Payment Required', async () => {
      // Consumir los 3 créditos en 3 lecciones distintas
      creditBalance = 0;

      const res = await request(app.getHttpServer())
        .post(`/lessons/${lessonBId}/access`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(402);

      expect(res.body.status).toBe(402);
      expect(res.body.detail).toContain('3 créditos iniciales');
    });
  });

  describe('Completitud de Lecciones y Sincronización Batch (SC-05.1.3)', () => {
    it('Given un estudiante viendo una lección, When la marca como completada, Then se registra su progreso', async () => {
      const res = await request(app.getHttpServer())
        .post(`/lessons/${lessonAId}/complete`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(res.body.lessonId).toBe(lessonAId);
      expect(res.body.isCompleted).toBe(true);
      expect(completedLessons.has(`${studentId}_${lessonAId}`)).toBe(true);
    });

    it('Given múltiples lecciones avanzadas, When sincroniza en batch, Then se actualizan todas con éxito', async () => {
      const res = await request(app.getHttpServer())
        .post('/progress/sync-batch')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ lessonIds: [lessonAId, lessonBId] })
        .expect(200);

      expect(res.body.syncedCount).toBe(2);
    });
  });

  describe('Stripe Developer Mode & Webhooks Idempotentes (SC-09.3.1)', () => {
    it('Given un estudiante bloqueado por 0 créditos, When se procesa un webhook de suscripción con tarjeta 4242, Then su suscripción se activa y accede libremente', async () => {
      creditBalance = 0;

      // 1. Verificar bloqueo inicial (402)
      await request(app.getHttpServer())
        .post(`/lessons/${lessonBId}/access`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(402);

      // 2. Webhook Stripe: checkout.session.completed
      const webhookPayload = {
        id: 'evt_stripe_test_1001',
        type: 'checkout.session.completed',
        data: {
          object: {
            client_reference_id: studentId,
            customer: 'cus_test_4242',
            subscription: 'sub_test_unlimited',
          },
        },
      };

      const webhookRes = await request(app.getHttpServer())
        .post('/payments/webhook')
        .send(webhookPayload)
        .expect(200);

      expect(webhookRes.body.status).toBe('PROCESSED');
      expect(userSubscriptionStatus).toBe(SubscriptionStatus.ACTIVE);

      // 3. Ahora el alumno accede a la nueva lección sin error y sin costo
      const accessRes = await request(app.getHttpServer())
        .post(`/lessons/${lessonBId}/access`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(accessRes.body.isSubscription).toBe(true);
      expect(accessRes.body.creditDebited).toBe(false);
    });

    it('Given un webhook ya procesado, When se reenvía el mismo ID de evento, Then se ignora de forma idempotente sin duplicar', async () => {
      const webhookPayload = {
        id: 'evt_stripe_duplicate_test',
        type: 'checkout.session.completed',
        data: {
          object: {
            client_reference_id: studentId,
          },
        },
      };

      // Primera recepción
      await request(app.getHttpServer())
        .post('/payments/webhook')
        .send(webhookPayload)
        .expect(200);

      // Reenvío duplicado
      const duplicateRes = await request(app.getHttpServer())
        .post('/payments/webhook')
        .send(webhookPayload)
        .expect(200);

      expect(duplicateRes.body.duplicate).toBe(true);
      expect(duplicateRes.body.status).toBe('ALREADY_PROCESSED');
    });
  });
});
