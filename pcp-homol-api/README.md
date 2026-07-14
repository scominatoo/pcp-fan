# pcp-homol-api

API REST do módulo **PCP** (homologação FANANDRI) — NestJS + Prisma + PostgreSQL.

## Repositórios relacionados

| Repo | Função |
|------|--------|
| [pcp-homol-web](../pcp-homol-web) | Frontend React |
| [pcp-homol-migracao](../pcp-homol-migracao) | Carga dos `.DAT` legados |
| [pcp-homol-docs](../pcp-homol-docs) | Documentação (fonte da verdade) |

## Pré-requisitos

- Node.js 20+
- Docker Desktop

## Primeira execução

```bash
cp .env.example .env
docker compose up -d
npm install
npx prisma migrate dev
npm run start:dev
```

- API: http://localhost:3000
- Health: http://localhost:3000/api/health

## Scripts

| Comando | Descrição |
|---------|-----------|
| `npm run start:dev` | API em modo desenvolvimento |
| `npm run prisma:migrate` | Aplicar migrations |
| `npm run prisma:studio` | Interface visual do banco |

## Documentação

Decisões de arquitetura, modelo de dados e plano: **[pcp-homol-docs](../pcp-homol-docs/docs/README.md)**
