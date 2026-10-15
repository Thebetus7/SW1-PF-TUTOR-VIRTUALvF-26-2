// backend/src/main.ts
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { GlobalHttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Habilitar CORS para clientes frontend web y móvil
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Prefijo universal de la API REST
  app.setGlobalPrefix('api/v1');

  // Filtro de excepciones estándar RFC 7807
  app.useGlobalFilters(new GlobalHttpExceptionFilter());

  // Validación estricta y transformación automática de DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Configuración de Swagger OpenAPI
  const config = new DocumentBuilder()
    .setTitle('Plataforma LMS Adaptativa con Tutor 3D')
    .setDescription(
      'API REST para la gestión de cursos, lecciones, rutas adaptativas con Gemini, paywall Stripe y analítica docente.',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`Backend NestJS ejecutándose en: http://localhost:${port}/api/v1`);
  console.log(`Documentación Swagger OpenAPI: http://localhost:${port}/api/docs`);
}

bootstrap();
