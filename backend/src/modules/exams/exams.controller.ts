// backend/src/modules/exams/exams.controller.ts
import { Controller, Post, Get, Body, Param, UseGuards, Request, ParseUUIDPipe, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ExamsService } from './exams.service';
import { SubmitExamDto } from './dto/submit-exam.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Exámenes y Evaluaciones Formativas')
@Controller('exams')
export class ExamsController {
  constructor(private readonly examsService: ExamsService) {}

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un examen con sus preguntas y opciones' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.examsService.findOne(id);
  }

  @Post(':id/submit')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Rendir un examen formativo con reintentos libres, umbral del 70% y feedback motivacional',
  })
  @ApiResponse({ status: 200, description: 'Examen evaluado exitosamente' })
  async submitExam(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: any,
    @Body() dto: SubmitExamDto,
  ) {
    return this.examsService.submitExam(req.user.id, id, dto);
  }
}
