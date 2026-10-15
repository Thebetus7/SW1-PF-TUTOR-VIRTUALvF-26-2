// backend/prisma/seed.ts
import { PrismaClient, Role, CourseStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Sembrando datos demo oficiales...');
  const saltRounds = 10;
  const passwordHash = await bcrypt.hash('Password123!', saltRounds);

  // 1. Usuario Estudiante Demo (con 3 créditos iniciales)
  const student = await prisma.user.upsert({
    where: { email: 'student@test.com' },
    update: { passwordHash, name: 'Estudiante Demo', role: Role.STUDENT },
    create: {
      email: 'student@test.com',
      name: 'Estudiante Demo',
      passwordHash,
      role: Role.STUDENT,
    },
  });

  await prisma.creditAccount.upsert({
    where: { userId: student.id },
    update: { balance: 3 },
    create: { userId: student.id, balance: 3 },
  });

  // 2. Usuario Docente Demo
  const teacher = await prisma.user.upsert({
    where: { email: 'teacher@test.com' },
    update: { passwordHash, name: 'Profesor Demo', role: Role.TEACHER },
    create: {
      email: 'teacher@test.com',
      name: 'Profesor Demo',
      passwordHash,
      role: Role.TEACHER,
    },
  });

  // 3. Usuario Administrador Demo
  await prisma.user.upsert({
    where: { email: 'admin@test.com' },
    update: { passwordHash, name: 'Administrador Demo', role: Role.ADMIN },
    create: {
      email: 'admin@test.com',
      name: 'Administrador Demo',
      passwordHash,
      role: Role.ADMIN,
    },
  });

  // 4. Categoría y Cursos Demo
  const category = await prisma.courseCategory.upsert({
    where: { name: 'Desarrollo Web' },
    update: {},
    create: {
      name: 'Desarrollo Web',
      description: 'Cursos de frontend, backend y arquitectura de software moderna',
    },
  });

  const course = await prisma.course.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      title: 'Desarrollo Web Fullstack con React y NestJS',
      description: 'Aprende a construir aplicaciones escalables desacopladas con TypeScript, Three.js y Postgres',
      teacherId: teacher.id,
      categoryId: category.id,
      status: CourseStatus.PUBLISHED,
    },
  });

  const module1 = await prisma.module.upsert({
    where: { id: '00000000-0000-0000-0000-000000000010' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000010',
      title: 'Módulo 1: Fundamentos y Arquitectura',
      order: 1,
      courseId: course.id,
    },
  });

  const lesson1 = await prisma.lesson.upsert({
    where: { id: '00000000-0000-0000-0000-000000000100' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000100',
      title: 'Introducción a Componentes React y JSX',
      videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      contextText: 'En esta lección explicamos la anatomía de un componente funcional, el ciclo de vida reactivo y JSX.',
      order: 1,
      moduleId: module1.id,
    },
  });

  // Examen de la lección con formulario de opciones
  const exam1 = await prisma.exam.upsert({
    where: { id: '00000000-0000-0000-0000-000000001000' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000001000',
      lessonId: lesson1.id,
      title: 'Examen de Comprobación: JSX y Componentes',
      passScore: 70.0,
    },
  });

  const q1 = await prisma.question.upsert({
    where: { id: '00000000-0000-0000-0000-000000010000' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000010000',
      examId: exam1.id,
      text: '¿Qué es JSX en el ecosistema de React?',
      points: 1.0,
    },
  });

  await prisma.option.upsert({
    where: { id: '00000000-0000-0000-0000-000000100001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000100001',
      questionId: q1.id,
      text: 'Una extensión de sintaxis de JavaScript que permite escribir estructuras similares a HTML',
      isCorrect: true,
    },
  });

  await prisma.option.upsert({
    where: { id: '00000000-0000-0000-0000-000000100002' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000100002',
      questionId: q1.id,
      text: 'Un motor de base de datos relacional embebido',
      isCorrect: false,
    },
  });

  console.log('✅ Base de datos sembrada con usuarios demo y contenido curricular de prueba');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
