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

## Dependências (importante)

Este projeto é **Node.js**, não Python. Não há `requirements.txt`.

As dependências estão em:

| Pasta | Arquivos |
|-------|----------|
| `pcp-homol-api/` | `package.json` + `package-lock.json` |
| `pcp-homol-web/` | `package.json` + `package-lock.json` |
| `pcp-homol-migracao/` | `package.json` + `package-lock.json` |

No servidor, após o clone:

```bash
cd pcp-homol-api && npm ci
cd ../pcp-homol-web && npm ci
cd ../pcp-homol-migracao && npm ci   # só se for migrar dados
```

Copie também os exemplos de ambiente (nunca versionamos `.env` com segredos):

```bash
cp pcp-homol-api/.env.example pcp-homol-api/.env
cp pcp-homol-web/.env.example pcp-homol-web/.env
# edite DATABASE_URL, JWT_SECRET, CORS, etc. para produção
```

## Clonar

```bash
git clone git@github.com:scominatoo/pcp-fan.git
cd pcp-fan
```

## Subir o ambiente

```bash
# 1. Banco (Docker) — na pasta da API
cd pcp-homol-api
docker compose up -d
cp .env.example .env   # se ainda não existir
npm ci
npx prisma migrate deploy
npm run build
npm run start:prod

# 2. Frontend
cd ../pcp-homol-web
cp .env.example .env
npm ci
npm run build
npm run preview   # ou sirva a pasta dist/ com nginx
```

## Documentação

Comece por [pcp-homol-docs/docs/README.md](pcp-homol-docs/docs/README.md).
