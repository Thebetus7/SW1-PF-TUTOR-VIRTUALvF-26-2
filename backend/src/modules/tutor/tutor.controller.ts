// backend/src/modules/tutor/tutor.controller.ts
import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { TutorService } from './tutor.service';
import { ChatTutorDto } from './dto/chat-tutor.dto';
import { TestConnectionDto } from './dto/test-connection.dto';
import {
  StartModuleEvaluationDto,
  AnswerModuleEvaluationDto,
} from './dto/module-evaluation.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Docente Virtual Multimodal')
@Controller('tutor')
export class TutorController {
  constructor(private readonly tutorService: TutorService) {}

  @Post('test-connection')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Prueba de conexión en tiempo real con Google Gemini API (devuelve frase dinámica y visemas)',
  })
  @ApiResponse({ status: 200, description: 'Conexión validada con éxito' })
  async testConnection(@Body() _dto: TestConnectionDto) {
    return this.tutorService.testGeminiConnection();
  }

  @Get('module-evaluation/context/:moduleId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Obtiene las lecciones y contexto pedagógico recopilado para auditar la evaluación modular',
  })
  @ApiResponse({ status: 200, description: 'Contexto pedagógico recopilado del módulo' })
  async getModuleContext(@Param('moduleId') moduleId: string) {
    return this.tutorService.getModuleCollectedContext(moduleId);
  }

  @Post('module-evaluation/start')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Inicia la evaluación interactiva del módulo con el Docente Virtual (0 créditos requeridos)',
  })
  @ApiResponse({ status: 200, description: 'Sesión iniciada con la pregunta de la lección 1' })
  async startModuleEvaluation(
    @Request() req: any,
    @Body() dto: StartModuleEvaluationDto,
  ) {
    return this.tutorService.startModuleEvaluation(req.user.id, dto);
  }

  @Post('module-evaluation/answer')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Envía respuesta de una lección, califica con IA, provee emoción/postura del avatar y avanza turno',
  })
  @ApiResponse({ status: 200, description: 'Respuesta evaluada con retroalimentación y siguiente turno' })
  async answerModuleEvaluation(
    @Request() req: any,
    @Body() dto: AnswerModuleEvaluationDto,
  ) {
    return this.tutorService.answerModuleEvaluation(req.user.id, dto);
  }

  @Post('chat')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Enviar mensaje al Tutor Virtual en lección y recibir respuesta pedagógica con visemas',
  })
  @ApiResponse({ status: 200, description: 'Respuesta generada con pista de visemas' })
  async chat(@Request() req: any, @Body() dto: ChatTutorDto) {
    return this.tutorService.chatWithTutor(req.user.id, dto);
  }
}
