# 04 — Estrutura do projeto

Como o projeto está organizado (Jul/2026).

> **Decisão:** repositórios Git **separados**, mas todos dentro da pasta principal `pcp-homol/`. Ver `11-repositorios-separados.md`.

---

## Pasta principal do projeto

```
/Users/scominato/pcp-homol/              # pasta principal do projeto
├── pcp-homol-api/                       # API NestJS + Prisma + Docker
├── pcp-homol-web/                       # Frontend React + Vite
├── pcp-homol-migracao/                  # CLI migração .DAT → PostgreSQL
├── pcp-homol-docs/                      # Documentação (fonte da verdade)
│   └── docs/                            # Arquivos .md numerados (01–12)
├── .tools/node/                         # Node.js 20 portátil
├── scripts/env-node.sh                  # Node portátil no PATH
└── README.md                            # índice desta pasta
```

Cada subpasta `pcp-homol-*` é um **repositório Git independente** (pronto para GitHub), mas fisicamente ficam agrupados sob `pcp-homol/` para facilitar o dia a dia.

> **Limpeza de 10/07/2026:** as pastas legadas do antigo monorepo (`backend/`, `frontend/`, `tools/`, `docs/` e o `docker-compose.yml` da raiz) foram **removidas**. Todo o código vive nos repositórios `pcp-homol-*`.

---

### pcp-homol-api

```
pcp-homol-api/
├── src/                    # Módulos NestJS
├── prisma/
│   ├── schema.prisma       # Fonte da verdade do banco
│   └── migrations/
├── docker-compose.yml
├── .env.example
└── package.json
```

### pcp-homol-web

```
pcp-homol-web/
├── src/
├── vite.config.ts          # proxy /api → porta 3001
└── package.json
```

### pcp-homol-migracao

```
pcp-homol-migracao/
├── src/
│   ├── ler-indexed-dat.ts
│   ├── migrar-cadastros.ts
│   ├── migrar-processo.ts
│   ├── migrar-ops.ts
│   └── layouts/
├── prisma/schema.prisma    # Cópia — sincronizar com a API
└── package.json
```

### pcp-homol-docs

```
pcp-homol-docs/
└── docs/                   # Todos os .md numerados (01–12)
```

---

## Pré-requisitos

| Ferramenta | Versão |
|------------|--------|
| Node.js | 20 LTS |
| Docker Desktop | 29.x+ |
| Pasta FANANDRI | `/Users/scominato/FANANDRI` |

---

## Variáveis de ambiente por repositório

### pcp-homol-api (`.env`)

| Variável | Padrão |
|----------|--------|
| `DATABASE_URL` | `postgresql://pcp:...@localhost:5432/pcp_homol` |
| `BACKEND_PORT` | `3001` |
| `CORS_ORIGIN` | `http://localhost:5175` |

### pcp-homol-web

O frontend usa **proxy Vite** em desenvolvimento (`/api` → `http://127.0.0.1:3001`). Não precisa de `.env` para rodar localmente.

### pcp-homol-migracao (`.env`)

| Variável | Padrão |
|----------|--------|
| `DATABASE_URL` | mesmo da API |
| `LEGACY_DATA_PATH` | `/Users/scominato/FANANDRI` |

---

## Subir o ambiente (dia a dia)

```bash
# 1. Banco (na pasta da API)
cd /Users/scominato/pcp-homol/pcp-homol-api
docker compose up -d

# 2. API (terminal 1)
npm run start:dev

# 3. Frontend (terminal 2)
cd /Users/scominato/pcp-homol/pcp-homol-web
npm run dev
```

---

## URLs em desenvolvimento

| Serviço | URL |
|---------|-----|
| API health | http://localhost:3001/api/health |
| Frontend | http://localhost:5175 |
| PostgreSQL | `localhost:5432` / DB `pcp_homol` |

---

## Convenções

| Repo | Convenção |
|------|-----------|
| API | Módulos NestJS por domínio PCP |
| Web | Rotas por área; consome só REST |
| Migração | CLI; não deploy em produção |
| Docs | Atualizar antes de implementar |

Próximos passos: `08-proximos-passos.md`.
