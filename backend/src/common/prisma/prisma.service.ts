// backend/src/common/prisma/prisma.service.ts
import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('✅ Conexión establecida con PostgreSQL exitosamente.');

      // Verificación de integridad: comprobar si existen las tablas del sistema
      try {
        const userCount = await this.user.count();
        if (userCount === 0) {
          this.logger.warn(
            '⚠️ BASE DE DATOS SIN USUARIOS DEMO: Ejecuta "npm run db:seed" o "npm run db:setup" para sembrar los usuarios de prueba.',
          );
        }
      } catch (err: any) {
        if (err.code === 'P2021' || err.message?.includes('does not exist')) {
          this.logger.error(
            '❌ TABLAS NO ENCONTRADAS: La base de datos no tiene las tablas creadas. Ejecuta "npm run db:setup" en el backend para crearlas y sembrar datos automáticamente.',
          );
        }
      }
    } catch (error: any) {
      if (error.code === 'P1000') {
        this.logger.error(
          '❌ ERROR DE AUTENTICACIÓN (P1000): Las credenciales de DATABASE_URL en backend/.env no son válidas. Revisa usuario y contraseña de tu PostgreSQL.',
        );
      } else {
        this.logger.error(`❌ Error al conectar con la base de datos: ${error.message}`);
      }
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
