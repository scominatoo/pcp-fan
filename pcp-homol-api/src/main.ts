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

  // CORS — aceita uma origem ou várias separadas por vírgula no .env
  // Ex.: https://pcp.synnex.com.br,http://localhost:5175
  const corsRaw = process.env.CORS_ORIGIN ?? 'http://localhost:5173';
  const corsOrigin = corsRaw.includes(',')
    ? corsRaw.split(',').map((o) => o.trim()).filter(Boolean)
    : corsRaw;
  app.enableCors({
    origin: corsOrigin,
    credentials: true,
  });

  // Porta da API: BACKEND_PORT no .env (neste servidor = 3000)
  const port = Number(process.env.BACKEND_PORT ?? 3000);
  await app.listen(port);
  console.log(`PCP Homologação API rodando em http://localhost:${port}/api`);
}

bootstrap();
