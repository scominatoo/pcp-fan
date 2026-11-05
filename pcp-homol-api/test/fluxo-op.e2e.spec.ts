/**
 * Fluxos que gravam dados: login, permissões, OP (criar → emitir → baixar
 * operação → baixar MP → encerrar).
 *
 * Precisa de um banco de TESTE vazio com as migrations aplicadas:
 *   DATABASE_URL=postgresql://.../pcp_test npx prisma migrate deploy
 *   DATABASE_URL=postgresql://.../pcp_test npm test
 * O teste APAGA os dados das tabelas — nunca aponte para o banco real.
 */
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import request from 'supertest';

const DB = process.env.DATABASE_URL ?? '';
if (!/test/i.test(DB)) {
  throw new Error('DATABASE_URL precisa apontar para um banco de teste (nome com "test").');
}

process.env.JWT_SECRET ??= 'segredo-de-teste-com-mais-de-32-caracteres';
process.env.ADMIN_USERNAME = 'admin';
process.env.ADMIN_PASSWORD = 'Admin#Teste1';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { AppModule } = require('../src/app.module');

const prisma = new PrismaClient();
let app: INestApplication;
let http: ReturnType<typeof request>;
let tokenAdmin: string;

async function limparBanco() {
  const tabelas: Array<{ tablename: string }> = await prisma.$queryRaw`
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'`;
  const lista = tabelas.map((t) => `"public"."${t.tablename}"`).join(', ');
  await prisma.$executeRawUnsafe(`TRUNCATE ${lista} RESTART IDENTITY CASCADE`);
}

async function login(username: string, password: string) {
  return http.post('/api/auth/login').send({ username, password });
}

beforeAll(async () => {
  await limparBanco();

  // Roteiro mínimo: desenho TESTE-001 com 2 operações
  await prisma.processoProdutivo.create({
    data: {
      produtoCodigo: 'TESTE-001',
      operacoes: { create: [{ numeroOperacao: 1 }, { numeroOperacao: 2 }] },
    },
  });
  await prisma.materiaPrima.create({
    data: { classeLetra: 'A', classeNumero: 1, itemCodigo: 1, descricao: 'CHAPA TESTE', quantidade: 100 },
  });

  const mod = await Test.createTestingModule({ imports: [AppModule] }).compile();
  app = mod.createNestApplication();
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  await app.init();
  http = request(app.getHttpServer());

  const res = await login('admin', 'Admin#Teste1');
  expect(res.status).toBe(201);
  tokenAdmin = res.body.accessToken;
});

afterAll(async () => {
  await app?.close();
  await prisma.$disconnect();
});

const auth = (t: string) => ({ Authorization: `Bearer ${t}` });

describe('autenticação', () => {
  it('rota protegida sem token → 401', async () => {
    expect((await http.get('/api/ordens-producao')).status).toBe(401);
  });

  it('health é público', async () => {
    const res = await http.get('/api/health');
    expect(res.body.database).toBe('ok');
  });

  it('senha errada → 401 e, depois de 5 tentativas, 429', async () => {
    const codigos: number[] = [];
    for (let i = 0; i < 6; i++) codigos.push((await login('bloqueio', 'SenhaErrada1')).status);
    expect(codigos.slice(0, 5)).toEqual([401, 401, 401, 401, 401]);
    expect(codigos[5]).toBe(429);
  });

  it('usuário sem permissão de criar OP recebe 403', async () => {
    await prisma.usuario.create({
      data: {
        username: 'leitor',
        nome: 'Só leitura',
        senhaHash: await bcrypt.hash('Leitor#Teste1', 4),
        permissoes: ['ordens_producao.ver'],
      },
    });
    const { body } = await login('leitor', 'Leitor#Teste1');
    const t = body.accessToken;
    expect((await http.get('/api/ordens-producao').set(auth(t))).status).toBe(200);
    const res = await http
      .post('/api/ordens-producao')
      .set(auth(t))
      .send({ produtoCodigo: 'TESTE-001', quantidade: 10 });
    expect(res.status).toBe(403);
  });
});

describe('ordem de produção', () => {
  let opId: number;
  let mpId: number;

  it('cria OP a partir do roteiro', async () => {
    const res = await http
      .post('/api/ordens-producao')
      .set(auth(tokenAdmin))
      .send({ produtoCodigo: 'TESTE-001', quantidade: 500 });
    expect(res.status).toBe(201);
    expect(res.body.operacoes).toHaveLength(2);
    opId = res.body.id;
  });

  it('recusa desenho sem roteiro', async () => {
    const res = await http
      .post('/api/ordens-producao')
      .set(auth(tokenAdmin))
      .send({ produtoCodigo: 'NAO-EXISTE', quantidade: 1 });
    expect(res.status).toBe(400);
  });

  it('emite (dados de impressão)', async () => {
    const res = await http.get(`/api/ordens-producao/${opId}/emissao`).set(auth(tokenAdmin));
    expect(res.status).toBe(200);
  });

  it('baixa uma operação', async () => {
    const res = await http
      .post(`/api/ordens-producao/${opId}/baixas/operacao`)
      .set(auth(tokenAdmin))
      .send({ numeroOperacao: 1, qtdeSaida: 480 });
    expect(res.status).toBe(201);
  });

  it('recusa baixa de operação inexistente', async () => {
    const res = await http
      .post(`/api/ordens-producao/${opId}/baixas/operacao`)
      .set(auth(tokenAdmin))
      .send({ numeroOperacao: 9, qtdeSaida: 1 });
    expect(res.status).toBe(400);
  });

  it('baixa matéria-prima e desconta do estoque', async () => {
    mpId = (await prisma.materiaPrima.findFirstOrThrow()).id;
    const res = await http
      .post(`/api/ordens-producao/${opId}/baixas-mp`)
      .set(auth(tokenAdmin))
      .send({ materiaPrimaId: mpId, quantidade: 30 });
    expect(res.status).toBe(201);
    const mp = await prisma.materiaPrima.findUniqueOrThrow({ where: { id: mpId } });
    expect(Number(mp.quantidade)).toBe(70);
  });

  it('recusa baixa de MP acima do estoque', async () => {
    const res = await http
      .post(`/api/ordens-producao/${opId}/baixas-mp`)
      .set(auth(tokenAdmin))
      .send({ materiaPrimaId: mpId, quantidade: 71 });
    expect(res.status).toBe(400);
  });

  it('baixas de MP simultâneas nunca deixam o estoque negativo', async () => {
    // 70 em estoque; 5 pedidos de 20 ao mesmo tempo → no máximo 3 passam
    const res = await Promise.all(
      Array.from({ length: 5 }, (_, i) =>
        http
          .post(`/api/ordens-producao/${opId}/baixas-mp`)
          .set(auth(tokenAdmin))
          // horários distintos para não colidir na chave do movimento
          .send({ materiaPrimaId: mpId, quantidade: 20, dataBaixa: new Date(Date.now() + i * 1000).toISOString() }),
      ),
    );
    const status = res.map((r) => r.status).sort();
    expect(status).toEqual([201, 201, 201, 400, 400]);
    const mp = await prisma.materiaPrima.findUniqueOrThrow({ where: { id: mpId } });
    expect(Number(mp.quantidade)).toBe(10);
  });

  it('encerra a OP e bloqueia novas baixas', async () => {
    const res = await http
      .post(`/api/ordens-producao/${opId}/encerrar`)
      .set(auth(tokenAdmin))
      .send({ pecasProduzidas: 480 });
    expect(res.status).toBe(201);

    const depois = await http
      .post(`/api/ordens-producao/${opId}/baixas/operacao`)
      .set(auth(tokenAdmin))
      .send({ numeroOperacao: 2, qtdeSaida: 1 });
    expect(depois.status).toBe(400);
    expect((await http.get(`/api/ordens-producao/${opId}/emissao`).set(auth(tokenAdmin))).status).toBe(400);
  });
});
