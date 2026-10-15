// backend/test/course-enrollment.e2e-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/common/prisma/prisma.service';
import { GlobalHttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { Role, CourseStatus } from '@prisma/client';
import { JwtService } from '@nestjs/jwt';

describe('Vertical Slice 6: Jerarquía Curricular, Pre-Inscripción & Hash Router (BDD E2E)', () => {
  let app: INestApplication;
  let jwtService: JwtService;

  const teacherId = 'teacher-uuid-7777';
  const studentId = 'student-uuid-8888';
  let teacherToken: string;
  let studentToken: string;

  const testCourseId = 'a1111111-0000-4000-8000-000000000001';
  const testModuleId = 'b2222222-0000-4000-8000-000000000002';
  const testLessonId = 'c3333333-0000-4000-8000-000000000003';

  const enrollmentsDb = new Map<string, any>();

  const mockPrismaService = {
    user: {
      findUnique: jest.fn().mockImplementation(({ where }) => {
        if (where.id === teacherId) {
          return Promise.resolve({
            id: teacherId,
            email: 'teacher@test.com',
            role: Role.TEACHER,
            name: 'Prof. Carlos',
            pushToken: 'ExponentPushToken[teacher_mock]',
          });
        }
        if (where.id === studentId) {
          return Promise.resolve({
            id: studentId,
            email: 'student@test.com',
            role: Role.STUDENT,
            name: 'Ana García',
          });
        }
        return Promise.resolve(null);
      }),
    },
    course: {
      findUnique: jest.fn().mockImplementation(({ where }) => {
        if (where.id === testCourseId) {
          const enrollmentsList = Array.from(enrollmentsDb.values()).filter(
            (e) => e.courseId === testCourseId,
          );
          return Promise.resolve({
            id: testCourseId,
            title: 'Curso de Matemáticas Lúdicas',
            description: 'Aprende fracciones y geometría jugando',
            status: CourseStatus.PUBLISHED,
            teacherId,
            category: { name: 'Matemáticas' },
            teacher: { id: teacherId, name: 'Prof. Carlos' },
            modules: [
              {
                id: testModuleId,
                title: 'Módulo 1: Introducción a las Fracciones',
                order: 1,
                lessons: [
                  {
                    id: testLessonId,
                    title: 'Lección 1: ¿Qué es una fracción?',
                    order: 1,
                    youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                    videoContext: 'Conceptos básicos',
                    durationSeconds: 300,
                  },
                ],
                exams: [],
              },
            ],
            enrollments: enrollmentsList,
          });
        }
        return Promise.resolve(null);
      }),
    },
    enrollment: {
      upsert: jest.fn().mockImplementation(({ where, create }) => {
        const key = `${create.userId}_${create.courseId}`;
        const existing = enrollmentsDb.get(key);
        if (existing) {
          return Promise.resolve(existing);
        }
        const created = {
          id: 'enr-' + Math.random().toString(36).substring(7),
          userId: create.userId,
          courseId: create.courseId,
          enrolledAt: new Date(),
        };
        enrollmentsDb.set(key, created);
        return Promise.resolve(created);
      }),
      findMany: jest.fn().mockResolvedValue([]),
    },
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
    app.setGlobalPrefix('api/v1');
    await app.init();

    jwtService = moduleFixture.get<JwtService>(JwtService);
    teacherToken = jwtService.sign({ sub: teacherId, email: 'teacher@test.com', role: Role.TEACHER });
    studentToken = jwtService.sign({ sub: studentId, email: 'student@test.com', role: Role.STUDENT });
  });

  afterAll(async () => {
    await app.close();
  });

  describe('SC-05.1.4: Exploración de temario y pre-inscripción del estudiante', () => {
    it('Dado que un estudiante no está inscrito en el curso, debe ver el temario completo con isEnrolled = false', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/courses/${testCourseId}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(response.body.id).toBe(testCourseId);
      expect(response.body.title).toBe('Curso de Matemáticas Lúdicas');
      expect(response.body.isEnrolled).toBe(false);
      expect(response.body.modules).toBeDefined();
      expect(response.body.modules.length).toBe(1);
      expect(response.body.modules[0].lessons.length).toBe(1);
      expect(response.body.modules[0].lessons[0].title).toBe('Lección 1: ¿Qué es una fracción?');
    });

    it('Cuando el estudiante hace clic en inscribirse, debe registrar la matrícula con éxito', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/v1/courses/${testCourseId}/enroll`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('inscrito exitosamente');
      expect(response.body.enrollmentId).toBeDefined();
    });

    it('Luego de inscribirse, la consulta del curso debe retornar isEnrolled = true', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/courses/${testCourseId}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(response.body.isEnrolled).toBe(true);
    });
  });
});
