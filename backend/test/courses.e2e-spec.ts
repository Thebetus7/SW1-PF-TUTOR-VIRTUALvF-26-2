// backend/test/courses.e2e-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/common/prisma/prisma.service';
import { GlobalHttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { Role, CourseStatus } from '@prisma/client';
import { JwtService } from '@nestjs/jwt';

describe('Vertical Slice 2: Catálogo Curricular & Lecciones (BDD E2E)', () => {
  let app: INestApplication;
  let jwtService: JwtService;

  const teacherId = 'teacher-uuid-1234';
  const studentId = 'student-uuid-5678';
  let teacherToken: string;
  let studentToken: string;

  // Repositorios en memoria para pruebas fail-fast
  const categoriesDb = new Map<string, any>();
  const coursesDb = new Map<string, any>();
  const modulesDb = new Map<string, any>();
  const lessonsDb = new Map<string, any>();
  const examsDb = new Map<string, any>();

  const testCourseId = 'a0000000-0000-4000-8000-000000000001';
  const testModuleId = 'b0000000-0000-4000-8000-000000000002';

  const mockPrismaService = {
    user: {
      findUnique: jest.fn().mockImplementation(({ where }) => {
        if (where.id === teacherId) {
          return Promise.resolve({ id: teacherId, email: 'teacher@test.com', role: Role.TEACHER, name: 'Profesor' });
        }
        if (where.id === studentId) {
          return Promise.resolve({ id: studentId, email: 'student@test.com', role: Role.STUDENT, name: 'Alumno' });
        }
        return Promise.resolve(null);
      }),
    },
    courseCategory: {
      upsert: jest.fn().mockImplementation(({ where, update, create }) => {
        let cat = categoriesDb.get(where.name);
        if (!cat) {
          cat = { id: 'cat-' + Math.random().toString(36).substring(7), ...create };
          categoriesDb.set(where.name, cat);
        }
        return Promise.resolve(cat);
      }),
    },
    course: {
      create: jest.fn().mockImplementation(({ data, include }) => {
        const course = {
          id: 'course-' + Math.random().toString(36).substring(7),
          title: data.title,
          description: data.description,
          teacherId: data.teacherId,
          categoryId: data.categoryId,
          status: data.status,
          category: { name: 'Desarrollo Web' },
          teacher: { id: teacherId, name: 'Profesor', email: 'teacher@test.com' },
          enrollments: [],
          modules: [],
        };
        coursesDb.set(course.id, course);
        return Promise.resolve(course);
      }),
      findMany: jest.fn().mockImplementation(() => {
        return Promise.resolve(Array.from(coursesDb.values()));
      }),
      findUnique: jest.fn().mockImplementation(({ where }) => {
        return Promise.resolve(coursesDb.get(where.id) || null);
      }),
      update: jest.fn().mockImplementation(({ where, data }) => {
        const course = coursesDb.get(where.id);
        if (course) {
          Object.assign(course, data);
        }
        return Promise.resolve(course);
      }),
      delete: jest.fn().mockImplementation(({ where }) => {
        coursesDb.delete(where.id);
        return Promise.resolve({ id: where.id });
      }),
    },
    module: {
      findUnique: jest.fn().mockImplementation(({ where }) => {
        return Promise.resolve(modulesDb.get(where.id) || null);
      }),
    },
    lesson: {
      create: jest.fn().mockImplementation(({ data }) => {
        const lesson = {
          id: 'lesson-' + Math.random().toString(36).substring(7),
          ...data,
          exams: [],
        };
        lessonsDb.set(lesson.id, lesson);
        return Promise.resolve(lesson);
      }),
      findUnique: jest.fn().mockImplementation(({ where }) => {
        const l = lessonsDb.get(where.id);
        if (!l) return Promise.resolve(null);
        return Promise.resolve({
          ...l,
          module: { course: { id: testCourseId, teacherId, title: 'Curso Test' } },
          exams: Array.from(examsDb.values()).filter((e) => e.lessonId === l.id),
        });
      }),
    },
    exam: {
      create: jest.fn().mockImplementation(({ data }) => {
        const exam = { id: 'exam-' + Math.random().toString(36).substring(7), ...data, questions: [] };
        examsDb.set(exam.id, exam);
        return Promise.resolve(exam);
      }),
    },
    question: {
      create: jest.fn().mockImplementation(({ data }) => {
        return Promise.resolve({ id: 'q-' + Math.random().toString(36).substring(7), ...data, options: [] });
      }),
    },
    option: {
      create: jest.fn().mockImplementation(({ data }) => {
        return Promise.resolve({ id: 'opt-' + Math.random().toString(36).substring(7), ...data });
      }),
    },
    $transaction: jest.fn().mockImplementation(async (callback) => {
      return callback(mockPrismaService);
    }),
    $connect: jest.fn().mockResolvedValue(undefined),
    $disconnect: jest.fn().mockResolvedValue(undefined),
  };

  beforeAll(async () => {
    jest.setTimeout(5000);

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

    jwtService = moduleFixture.get<JwtService>(JwtService);
    teacherToken = jwtService.sign({ sub: teacherId, email: 'teacher@test.com', role: Role.TEACHER });
    studentToken = jwtService.sign({ sub: studentId, email: 'student@test.com', role: Role.STUDENT });

    // Sembrar módulo de prueba para las lecciones
    modulesDb.set(testModuleId, {
      id: testModuleId,
      title: 'Módulo 1: Fundamentos',
      order: 1,
      courseId: testCourseId,
      course: { id: testCourseId, teacherId },
    });
  });

  afterAll(async () => {
    await app.close();
  });

  describe('SC-02.1.1: Creación de curso con categoría fallback', () => {
    it('debe permitir a un docente crear un curso y asignar categoría con selector tridimensional', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/courses')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          title: 'Arquitectura Hexagonal con TypeScript',
          description: 'Aprende a estructurar software desacoplado y mantenible',
          categoryName: 'Arquitectura de Software',
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('title', 'Arquitectura Hexagonal con TypeScript');
      expect(response.body.teacherId).toBe(teacherId);
    });

    it('debe rechazar la creación de curso si el usuario no tiene rol TEACHER', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/courses')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          title: 'Curso No Autorizado',
          description: 'Intento de creación con rol estudiante',
        })
        .expect(403);
    });
  });

  describe('SC-02.1.2: Creación de lección en web con enlace de YouTube, contexto del video y formulario opcional', () => {
    it('debe validar la URL canónica de YouTube, registrar contextText y crear el formulario evaluativo', async () => {
      const payload = {
        title: 'Componentes y Estado Reactivo',
        videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        contextText: 'En este video se explica el hook useState, reactividad e inmutabilidad en el frontend.',
        order: 1,
        downloadableUrl: 'https://skylearn.edu/guide.pdf',
        examForm: {
          title: 'Examen Rápido de Estado',
          questions: [
            {
              text: '¿Cómo se actualiza el estado en React?',
              options: [
                { text: 'Mediante la función setter retornada por useState', isCorrect: true },
                { text: 'Mutando la variable directamente', isCorrect: false },
              ],
            },
          ],
        },
      };

      const response = await request(app.getHttpServer())
        .post(`/api/v1/modules/${testModuleId}/lessons`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send(payload)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('title', 'Componentes y Estado Reactivo');
      expect(response.body).toHaveProperty('videoUrl', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ');
      expect(response.body).toHaveProperty('contextText');
      expect(response.body.contextText).toContain('useState');
    });

    it('debe rechazar lecciones con URLs que no pertenezcan al dominio de YouTube', async () => {
      const payload = {
        title: 'Video Inválido',
        videoUrl: 'https://vimeo.com/12345678', // No es YouTube
        contextText: 'Descripción de prueba',
        order: 2,
      };

      const response = await request(app.getHttpServer())
        .post(`/api/v1/modules/${testModuleId}/lessons`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send(payload)
        .expect(400);

      expect(response.body).toHaveProperty('status', 400);
      expect(response.body.detail).toContain('YouTube');
    });
  });

  describe('SC-02.1.3: Baja de curso con estudiantes inscritos aplica soft-delete y modo inactivo', () => {
    it('debe aplicar soft-delete (ARCHIVED) si el curso cuenta con alumnos inscritos', async () => {
      const courseWithStudents = {
        id: 'c0000000-0000-4000-8000-000000000003',
        title: 'Curso con Alumnos',
        description: 'Curso que tiene inscripciones activas',
        teacherId,
        status: CourseStatus.PUBLISHED,
        enrollments: [{ id: 'enr-1', userId: studentId, courseId: 'c0000000-0000-4000-8000-000000000003' }],
      };
      coursesDb.set(courseWithStudents.id, courseWithStudents);

      const response = await request(app.getHttpServer())
        .patch(`/api/v1/courses/${courseWithStudents.id}/archive`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('status', 'ARCHIVED');
      expect(response.body.message).toContain('modo archivado');
    });
  });
});
