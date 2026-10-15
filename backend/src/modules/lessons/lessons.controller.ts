// backend/src/modules/lessons/lessons.controller.ts
import { Controller, Post, Get, Body, Param, UseGuards, Request, ParseUUIDPipe, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { LessonsService } from './lessons.service';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/guards/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Lecciones y Contenidos')
@Controller()
export class LessonsController {
  constructor(private readonly lessonsService: LessonsService) {}

  @Post('modules/:id/lessons')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.TEACHER)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Crear una lección en un módulo con YouTube URL, variable de contexto y formulario evaluativo opcional',
  })
  @ApiResponse({ status: 201, description: 'Lección creada exitosamente' })
  async createLesson(
    @Param('id', ParseUUIDPipe) moduleId: string,
    @Request() req: any,
    @Body() dto: CreateLessonDto,
  ) {
    return this.lessonsService.createLesson(moduleId, req.user.id, dto);
  }

  @Get('lessons/:id')
  @ApiOperation({ summary: 'Consultar el detalle de una lección, su video y su formulario evaluativo' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.lessonsService.findOne(id);
  }

  @Post('lessons/:id/access')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Acceder a una lección (debita 1 crédito la primera vez o retorna permanente sin costo)',
  })
  @ApiResponse({ status: 200, description: 'Acceso concedido a la lección' })
  @ApiResponse({ status: 402, description: 'Créditos agotados, requiere suscripción' })
  async accessLesson(@Param('id', ParseUUIDPipe) id: string, @Request() req: any) {
    return this.lessonsService.accessLesson(req.user.id, id);
  }

  @Post('lessons/:id/complete')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Marcar manualmente una lección como completada' })
  @ApiResponse({ status: 200, description: 'Lección marcada como completada' })
  async completeLesson(@Param('id', ParseUUIDPipe) id: string, @Request() req: any) {
    return this.lessonsService.completeLesson(req.user.id, id);
  }

  @Post('progress/sync-batch')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Sincronizar en lote el progreso de múltiples lecciones completadas' })
  @ApiResponse({ status: 200, description: 'Progreso sincronizado exitosamente' })
  async syncBatch(@Request() req: any, @Body() dto: { lessonIds: string[] }) {
    return this.lessonsService.syncProgressBatch(req.user.id, dto.lessonIds || []);
  }
}
