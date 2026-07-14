# PCP Homologação — FANANDRI

Sistema web para substituir o módulo **PCP** do ERP legado COBOL da Indústria Metalúrgica FANANDRI Ltda.

## Estrutura

```
pcp-fan/
├── pcp-homol-api/        # API NestJS + Prisma + Docker PostgreSQL
├── pcp-homol-web/        # Frontend React + Vite
├── pcp-homol-migracao/   # Migração .DAT → PostgreSQL
├── pcp-homol-docs/       # Documentação (fonte da verdade)
└── scripts/              # Helpers locais
```

## Login

Único usuário: **admin**. Configure no `.env` da API:

- `ADMIN_USERNAME`
- `ADMIN_PASSWORD_HASH` (bcrypt — preferível) ou `ADMIN_PASSWORD` (só homologação)
- `JWT_SECRET`

## Dependências

Projeto **Node.js** (`package.json` + `package-lock.json`). Não há `requirements.txt`.

```bash
cd pcp-homol-api && npm ci
cd ../pcp-homol-web && npm ci
```

## Clonar

```bash
git clone git@github.com:scominatoo/pcp-fan.git
cd pcp-fan
```

## Desenvolvimento

```bash
# Banco
cd pcp-homol-api && docker compose up -d
cp .env.example .env   # preencha ADMIN_PASSWORD_HASH e JWT_SECRET
npm ci && npm run start:dev

# Frontend → http://localhost:5176
cd ../pcp-homol-web
cp .env.example .env
npm ci && npm run dev
```

## Documentação

[pcp-homol-docs/docs/README.md](pcp-homol-docs/docs/README.md)
