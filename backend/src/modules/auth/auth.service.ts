// backend/src/modules/auth/auth.service.ts
import { Injectable, ConflictException, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../common/prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (existing) {
      throw new ConflictException('El correo electrónico ya se encuentra registrado en la plataforma');
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(dto.password, saltRounds);

    // Transacción atómica: si es STUDENT, se inicializa automáticamente su CreditAccount con 3 créditos
    const user = await this.prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email: dto.email.toLowerCase(),
          passwordHash,
          name: dto.name,
          role: dto.role,
        },
      });

      if (dto.role === Role.STUDENT) {
        await tx.creditAccount.create({
          data: {
            userId: newUser.id,
            balance: 3, // Regla inviolable: 3 créditos iniciales
          },
        });
      }

      return newUser;
    });

    const fullUser = await this.prisma.user.findUnique({
      where: { id: user.id },
      include: { creditAccount: true, subscription: true },
    });

    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user: {
        id: fullUser!.id,
        email: fullUser!.email,
        name: fullUser!.name,
        role: fullUser!.role,
        credits: fullUser!.creditAccount?.balance ?? 0,
        subscriptionStatus: fullUser!.subscription?.status ?? 'INACTIVE',
      },
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
      include: { creditAccount: true, subscription: true },
    });

    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        credits: user.creditAccount?.balance ?? 0,
        subscriptionStatus: user.subscription?.status ?? 'INACTIVE',
      },
    };
  }

  async resetDemoData() {
    this.logger.log('Restableciendo datos demo administrativos...');

    const saltRounds = 10;
    const defaultPassword = 'Password123!';
    const defaultHash = await bcrypt.hash(defaultPassword, saltRounds);

    const demoUsers = [
      { email: 'student@test.com', name: 'Estudiante Demo', role: Role.STUDENT, credits: 3 },
      { email: 'teacher@test.com', name: 'Profesor Demo', role: Role.TEACHER, credits: 0 },
      { email: 'admin@test.com', name: 'Administrador Demo', role: Role.ADMIN, credits: 0 },
    ];

    for (const demo of demoUsers) {
      const user = await this.prisma.user.upsert({
        where: { email: demo.email },
        update: {
          passwordHash: defaultHash,
          name: demo.name,
          role: demo.role,
        },
        create: {
          email: demo.email,
          passwordHash: defaultHash,
          name: demo.name,
          role: demo.role,
        },
      });

      if (demo.role === Role.STUDENT) {
        await this.prisma.creditAccount.upsert({
          where: { userId: user.id },
          update: { balance: 3 },
          create: { userId: user.id, balance: 3 },
        });

        // Limpiar progresos demo anteriores para demostraciones limpias
        await this.prisma.lessonUnlock.deleteMany({ where: { userId: user.id } });
        await this.prisma.lessonProgress.deleteMany({ where: { userId: user.id } });
      }
    }

    return {
      success: true,
      message: 'Datos demo restablecidos exitosamente a su configuración inicial con 3 créditos',
      restoredUsers: demoUsers.map((u) => u.email),
    };
  }
}
