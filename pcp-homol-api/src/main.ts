import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Prefixo /api para todas as rotas
  app.setGlobalPrefix('api');

  // Validação automática dos DTOs (quando formos criando endpoints)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  // CORS — frontend React em desenvolvimento
  app.enableCors({
    origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
    credentials: true,
  });

  const port = process.env.BACKEND_PORT ?? 3000;
  await app.listen(port);
  console.log(`PCP Homologação API rodando em http://localhost:${port}/api`);
}

bootstrap();
