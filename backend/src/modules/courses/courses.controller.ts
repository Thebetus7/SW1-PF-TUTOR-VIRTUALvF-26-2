// backend/src/modules/courses/courses.controller.ts
import { Controller, Post, Get, Patch, Body, Param, UseGuards, Request, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CoursesService } from './courses.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../../common/guards/optional-jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/guards/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Catálogo Curricular')
@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.TEACHER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear un nuevo curso (requiere rol TEACHER)' })
  @ApiResponse({ status: 201, description: 'Curso creado exitosamente' })
  async create(@Request() req: any, @Body() dto: CreateCourseDto) {
    return this.coursesService.create(req.user.id, dto);
  }

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Listar todos los cursos disponibles en la plataforma' })
  async findAll(@Request() req: any) {
    const userId = req.user?.id;
    return this.coursesService.findAll(userId);
  }

  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Obtener detalle de un curso con sus módulos y lecciones' })
  async findOne(@Param('id', ParseUUIDPipe) id: string, @Request() req: any) {
    return this.coursesService.findOne(id, req.user?.id);
  }

  @Post(':id/enroll')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Inscribir al estudiante autenticado en un curso' })
  @ApiResponse({ status: 201, description: 'Inscripción realizada exitosamente' })
  async enroll(@Param('id', ParseUUIDPipe) id: string, @Request() req: any) {
    return this.coursesService.enroll(id, req.user.id);
  }

  @Patch(':id/archive')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.TEACHER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Dar de baja un curso (aplica soft-delete ARCHIVED si tiene alumnos)' })
  async archive(@Param('id', ParseUUIDPipe) id: string, @Request() req: any) {
    return this.coursesService.archive(id, req.user.id);
  }
}

