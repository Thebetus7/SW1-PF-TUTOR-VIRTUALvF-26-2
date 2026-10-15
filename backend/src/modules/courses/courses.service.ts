// backend/src/modules/courses/courses.service.ts
import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { CourseStatus } from '@prisma/client';
import { AnalyticsService } from '../analytics/analytics.service';

@Injectable()
export class CoursesService {
  private readonly logger = new Logger(CoursesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly analyticsService: AnalyticsService,
  ) {}

  /**
   * Crea un curso aplicando la garantía del Selector Tridimensional:
   * 1. Categoría existente.
   * 2. Categoría creada en caliente.
   * 3. Fallback neutro "General" ante catálogo vacío o no provisto.
   */
  async create(teacherId: string, dto: CreateCourseDto) {
    let categoryId: string | null = null;
    const catName = dto.categoryName ? dto.categoryName.trim() : 'General';

    const category = await this.prisma.courseCategory.upsert({
      where: { name: catName },
      update: {},
      create: {
        name: catName,
        description: `Categoría ${catName}`,
      },
    });
    categoryId = category.id;

    const course = await this.prisma.course.create({
      data: {
        title: dto.title,
        description: dto.description,
        teacherId,
        categoryId,
        status: CourseStatus.PUBLISHED,
        modules: {
          create: [
            {
              title: 'Módulo 1: Lecciones Principales',
              order: 1,
            },
          ],
        },
      },
      include: {
        category: true,
        teacher: {
          select: { id: true, name: true, email: true },
        },
        modules: true,
      },
    });

    return course;
  }

  async findAll(userId?: string) {
    const courses = await this.prisma.course.findMany({
      include: {
        category: true,
        teacher: { select: { id: true, name: true } },
        modules: {
          include: {
            lessons: {
              select: { id: true, title: true, order: true },
            },
          },
          orderBy: { order: 'asc' },
        },
        enrollments: userId ? { where: { userId } } : false,
      },
      orderBy: { createdAt: 'desc' },
    });

    return courses.map((course) => {
      const isEnrolled = course.enrollments && course.enrollments.length > 0;
      return {
        id: course.id,
        title: course.title,
        description: course.description,
        status: course.status,
        category: course.category?.name || 'General',
        teacherName: course.teacher?.name || 'Profesor Docente',
        modulesCount: course.modules?.length || 0,
        isEnrolled: !!isEnrolled,
        isDimmed: course.status === CourseStatus.ARCHIVED && isEnrolled,
      };
    });
  }

  async findOne(id: string, userId?: string) {
    const course = await this.prisma.course.findUnique({
      where: { id },
      include: {
        category: true,
        teacher: { select: { id: true, name: true } },
        modules: {
          include: {
            lessons: {
              orderBy: { order: 'asc' },
              select: {
                id: true,
                title: true,
                order: true,
                videoUrl: true,
                contextText: true,
              },
            },
            exams: {
              select: {
                id: true,
                title: true,
              },
            },
          },
          orderBy: { order: 'asc' },
        },
        enrollments: true,
      },
    });

    if (!course) {
      throw new NotFoundException(`Curso con ID ${id} no encontrado`);
    }

    const isEnrolled = userId ? course.enrollments.some((e) => e.userId === userId) : false;

    return {
      id: course.id,
      title: course.title,
      description: course.description,
      status: course.status,
      category: course.category?.name || 'General',
      teacherName: course.teacher?.name || 'Profesor Docente',
      teacherId: course.teacherId,
      isEnrolled,
      modules: course.modules,
    };
  }

  /**
   * RF-05.5: Matrícula explícita del estudiante en un curso con temario.
   * Envía notificación push al docente creador si tiene dispositivo registrado.
   */
  async enroll(courseId: string, userId: string) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      include: { teacher: true },
    });

    if (!course) {
      throw new NotFoundException(`Curso con ID ${courseId} no encontrado`);
    }

    const enrollment = await this.prisma.enrollment.upsert({
      where: {
        userId_courseId: {
          userId,
          courseId,
        },
      },
      update: {},
      create: {
        userId,
        courseId,
      },
    });

    // Notificación push al docente creador
    if (course.teacherId) {
      try {
        const student = await this.prisma.user.findUnique({ where: { id: userId } });
        await this.analyticsService.sendPushNotification(
          course.teacherId,
          'Nueva inscripción en tu curso',
          `El estudiante ${student?.name || 'Nuevo Alumno'} se ha inscrito en "${course.title}".`,
          { courseId, userId },
        );
      } catch (err: any) {
        this.logger.warn(`Error al notificar push al docente: ${err.message}`);
      }
    }

    return {
      success: true,
      message: 'Te has inscrito exitosamente en el curso',
      enrollmentId: enrollment.id,
      courseId: course.id,
    };
  }

  /**
   * RF-02.4: Baja de curso con alumnos inscritos aplica soft-delete (ARCHIVED).
   * Si carece de inscritos, permite eliminación física en cascada.
   */
  async archive(courseId: string, teacherId: string) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      include: { enrollments: true },
    });

    if (!course) {
      throw new NotFoundException(`Curso con ID ${courseId} no encontrado`);
    }

    if (course.teacherId !== teacherId) {
      throw new ForbiddenException('No tienes permisos para modificar este curso');
    }

    if (course.enrollments.length > 0) {
      // Soft-delete: Pasa a ARCHIVED, manteniéndose en modo tenue/deshabilitado para los alumnos inscritos
      const updated = await this.prisma.course.update({
        where: { id: courseId },
        data: { status: CourseStatus.ARCHIVED },
      });
      return {
        id: updated.id,
        status: updated.status,
        message: 'Curso dado de baja exitosamente (modo archivado tenue por tener alumnos inscritos)',
      };
    } else {
      // Eliminación física en cascada
      await this.prisma.course.delete({ where: { id: courseId } });
      return {
        id: courseId,
        status: 'DELETED',
        message: 'Curso eliminado físicamente al no registrar estudiantes inscritos',
      };
    }
  }
}
