// backend/src/modules/auth/auth.controller.ts
import { Controller, Post, Get, Patch, Body, Param, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UpdateCreditsDto } from './dto/update-credits.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/guards/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Autenticación y Administración')
@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('auth/register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar un nuevo usuario (inicializa 3 créditos si es STUDENT)' })
  @ApiResponse({ status: 201, description: 'Usuario registrado exitosamente con 3 créditos' })
  @ApiResponse({ status: 409, description: 'Conflicto: el correo electrónico ya existe' })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('auth/login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Iniciar sesión con correo y contraseña' })
  @ApiResponse({ status: 200, description: 'Inicio de sesión exitoso con token JWT' })
  @ApiResponse({ status: 401, description: 'Credenciales inválidas' })
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('admin/reset-demo-data')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Restablecer datos demo y balance de 3 créditos para pruebas y defensas' })
  @ApiResponse({ status: 200, description: 'Datos demo restablecidos' })
  @ApiResponse({ status: 403, description: 'Prohibido: se requiere rol ADMIN' })
  async resetDemoData() {
    return this.authService.resetDemoData();
  }

  @Get('admin/users')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar todos los usuarios y sus créditos para administración' })
  @ApiResponse({ status: 200, description: 'Lista de usuarios recuperada exitosamente' })
  @ApiResponse({ status: 403, description: 'Prohibido: se requiere rol ADMIN' })
  async listUsers() {
    return this.authService.listUsersForAdmin();
  }

  @Patch('admin/users/:id/credits')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Modificar manualmente los créditos de un usuario (para desarrollo/pruebas)' })
  @ApiParam({ name: 'id', description: 'ID del usuario a modificar' })
  @ApiResponse({ status: 200, description: 'Créditos actualizados exitosamente' })
  @ApiResponse({ status: 403, description: 'Prohibido: se requiere rol ADMIN' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  async updateCredits(@Param('id') id: string, @Body() dto: UpdateCreditsDto) {
    return this.authService.updateUserCredits(id, dto.balance);
  }
}

