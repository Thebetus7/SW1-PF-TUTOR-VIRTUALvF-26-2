// backend/src/modules/recommendations/recommendations.controller.ts
import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { RecommendationsService } from './recommendations.service';
import { SubmitQuizDto } from './dto/submit-quiz.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Recomendaciones y Rutas Adaptativas')
@Controller('recommendations')
export class RecommendationsController {
  constructor(private readonly recommendationsService: RecommendationsService) {}

  @Get('quiz')
  @ApiOperation({ summary: 'Obtener cuestionario opcional de recomendación inicial (gratuito)' })
  @ApiResponse({ status: 200, description: 'Cuestionario de 3 a 5 preguntas retornado con éxito' })
  async getQuiz() {
    return this.recommendationsService.getQuiz();
  }

  @Post('quiz/submit')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Enviar respuestas del cuestionario y compilar ruta adaptativa (costo 0 créditos)' })
  @ApiResponse({ status: 201, description: 'Ruta compilada e inscripción automática con botón de redirección' })
  async submitQuiz(@Request() req: any, @Body() dto: SubmitQuizDto) {
    return this.recommendationsService.submitQuiz(req.user.id, dto);
  }
}
