// backend/test/auth.e2e-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/common/prisma/prisma.service';
import { GlobalHttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { Role } from '@prisma/client';

describe('Vertical Slice 1: Auth, RBAC & 3 Créditos (BDD E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  // Repositorio en memoria para garantizar ejecución ultra rápida, fail-fast y autónoma
  const usersDb = new Map<string, any>();
  const creditsDb = new Map<string, any>();

  const mockPrismaService = {
    user: {
      findUnique: jest.fn().mockImplementation(({ where }) => {
        if (where.email) {
          return Promise.resolve(usersDb.get(where.email.toLowerCase()) || null);
        }
        if (where.id) {
          for (const u of usersDb.values()) {
            if (u.id === where.id) return Promise.resolve(u);
          }
        }
        return Promise.resolve(null);
      }),
      create: jest.fn().mockImplementation(({ data }) => {
        const id = 'user-' + Math.random().toString(36).substring(7);
        const user = {
          id,
          email: data.email.toLowerCase(),
          passwordHash: data.passwordHash,
          name: data.name,
          role: data.role,
          creditAccount: null,
          subscription: null,
        };
        usersDb.set(user.email, user);
        return Promise.resolve(user);
      }),
      upsert: jest.fn().mockImplementation(({ where, update, create }) => {
        const existing = usersDb.get(where.email.toLowerCase());
        if (existing) {
          Object.assign(existing, update);
          return Promise.resolve(existing);
        }
        const id = 'user-' + Math.random().toString(36).substring(7);
        const newUser = { id, ...create, creditAccount: null, subscription: null };
        usersDb.set(create.email.toLowerCase(), newUser);
        return Promise.resolve(newUser);
      }),
    },
    creditAccount: {
      create: jest.fn().mockImplementation(({ data }) => {
        const credit = { id: 'cred-' + Math.random().toString(36).substring(7), ...data };
        creditsDb.set(data.userId, credit);
        // Vincular con el usuario en memoria
        for (const u of usersDb.values()) {
          if (u.id === data.userId) {
            u.creditAccount = credit;
          }
        }
        return Promise.resolve(credit);
      }),
      upsert: jest.fn().mockImplementation(({ where, update, create }) => {
        let credit = creditsDb.get(where.userId);
        if (credit) {
          Object.assign(credit, update);
        } else {
          credit = { id: 'cred-demo', ...create };
          creditsDb.set(where.userId, credit);
        }
        for (const u of usersDb.values()) {
          if (u.id === where.userId) {
            u.creditAccount = credit;
          }
        }
        return Promise.resolve(credit);
      }),
    },
    lessonUnlock: {
      deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
    },
    lessonProgress: {
      deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
    },
    $transaction: jest.fn().mockImplementation(async (callback) => {
      return callback(mockPrismaService);
    }),
    $connect: jest.fn().mockResolvedValue(undefined),
    $disconnect: jest.fn().mockResolvedValue(undefined),
  };

  beforeAll(async () => {
    jest.setTimeout(5000); // Regla Anti-Cuelgues: Timeout estricto de 5 segundos

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrismaService)
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalFilters(new GlobalHttpExceptionFilter());
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('SC-01.1.1: Registro exitoso de estudiante con 3 créditos iniciales', () => {
    it('debe registrar al estudiante y asignarle automáticamente balance = 3 créditos', async () => {
      const payload = {
        name: 'Carlos Alumno',
        email: 'carlos@test.com',
        password: 'Password123!',
        role: Role.STUDENT,
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(payload)
        .expect(201);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body.user).toHaveProperty('email', 'carlos@test.com');
      expect(response.body.user).toHaveProperty('role', 'STUDENT');
      // Invariante de negocio: 3 créditos iniciales
      expect(response.body.user).toHaveProperty('credits', 3);
    });
  });

  describe('SC-01.1.2: Intento de registro con correo duplicado', () => {
    it('debe responder con HTTP 409 Conflict y detalle RFC 7807 sin filtrar datos sensibles', async () => {
      const payload = {
        name: 'Carlos Duplicado',
        email: 'carlos@test.com', // Ya registrado en SC-01.1.1
        password: 'Password123!',
        role: Role.STUDENT,
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(payload)
        .expect(409);

      expect(response.body).toHaveProperty('status', 409);
      expect(response.body.title).toContain('Conflict');
      expect(response.body.detail).toContain('ya se encuentra registrado');
    });
  });

  describe('SC-01.1.3: Restablecimiento administrativo de usuarios de prueba', () => {
    it('debe permitir a un administrador restaurar datos demo y balance a 3 créditos', async () => {
      // 1. Registrar usuario administrador
      const adminRegister = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          name: 'Admin Global',
          email: 'admin-tester@test.com',
          password: 'Password123!',
          role: Role.ADMIN,
        })
        .expect(201);

      const adminToken = adminRegister.body.accessToken;

      // 2. Invocar reset-demo-data con token de admin
      const resetResponse = await request(app.getHttpServer())
        .post('/api/v1/admin/reset-demo-data')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(resetResponse.body).toHaveProperty('success', true);
      expect(resetResponse.body.message).toContain('3 créditos');
      expect(resetResponse.body.restoredUsers).toContain('student@test.com');
    });

    it('debe rechazar la solicitud con HTTP 403 Forbidden si el rol no es ADMIN', async () => {
      // Login o registro con rol STUDENT
      const studentLogin = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'carlos@test.com',
          password: 'Password123!',
        })
        .expect(200);

      const studentToken = studentLogin.body.accessToken;

      // Intentar reset-demo-data siendo estudiante
      await request(app.getHttpServer())
        .post('/api/v1/admin/reset-demo-data')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(403);
    });
  });
});
