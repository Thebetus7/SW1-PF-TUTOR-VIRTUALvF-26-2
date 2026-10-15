// backend/src/modules/analytics/analytics.controller.ts
import { Controller, Get, Post, Body, UseGuards, Request, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { RegisterDeviceDto } from './dto/register-device.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/guards/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Analítica y Dashboard Móvil Docente')
@Controller()
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('teacher/dashboard')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.TEACHER)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Obtener dashboard para el docente con 3 KPIs, semáforo pedagógico por curso y lección crítica',
  })
  @ApiResponse({ status: 200, description: 'Métricas del dashboard docente calculadas con éxito' })
  async getDashboard(@Request() req: any) {
    return this.analyticsService.getTeacherDashboard(req.user.id);
  }

  @Post('teacher/device-token')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.TEACHER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Registrar token de notificaciones push de Expo para el docente' })
  @ApiResponse({ status: 200, description: 'Token registrado exitosamente' })
  async registerToken(@Request() req: any, @Body() dto: RegisterDeviceDto) {
    return this.analyticsService.registerDeviceToken(req.user.id, dto.pushToken);
  }
}
