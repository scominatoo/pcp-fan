# 11 — Repositórios separados (não monorepo)

## Decisão

| | |
|---|---|
| **Decisão** | O projeto PCP **não será monorepo** |
| **Motivo** | Backend, frontend e ferramentas de migração evoluem em ritmos diferentes; equipes e deploys independentes; alinhamento com prática comum de micro-serviços / apps separados |
| **Estado atual** | Repositórios Git **independentes** em `/Users/scominato/pcp-homol/pcp-homol-*` |
| **Estado alvo** | Repositórios Git **independentes** (ver abaixo) |
| **Data** | Julho/2026 |

---

## O que é monorepo (e por que não queremos)

**Monorepo** = backend + frontend + scripts + docs no **mesmo repositório Git**, como está hoje em `pcp-homol/`.

**Problemas para o nosso caso:**

- Deploy do frontend (estático/CDN) é diferente do backend (API/servidor)
- Ferramenta de migração roda **poucas vezes** — não precisa ir junto no deploy da API
- Versionamento e permissões podem ser separados no futuro
- Na incorporação ao Synex, fica mais claro o que vira produto e o que foi só ferramenta de migração

---

## Workspace local (desde 10/07/2026)

Todos os repositórios ficam **dentro** da pasta principal do projeto:

```
/Users/scominato/pcp-homol/
├── pcp-homol-api/
├── pcp-homol-web/
├── pcp-homol-migracao/
└── pcp-homol-docs/
```

Cada um continua sendo um **repo Git separado** (para CI/CD e deploy independentes), mas fisicamente agrupados para organização no computador.

As pastas legadas do antigo monorepo (`backend/`, `frontend/`, `tools/migracao/` e `docs/` na raiz) foram **removidas em 10/07/2026** — todo o código vive nos repos acima.

---

## Repositórios alvo

```mermaid
flowchart LR
    subgraph repos [Repositórios Git separados]
        API[pcp-homol-api]
        WEB[pcp-homol-web]
        MIG[pcp-homol-migracao]
        DOCS[pcp-homol-docs]
    end

    WEB -->|HTTP REST| API
    MIG -->|carga inicial| API
    DOCS -.->|fonte da verdade| API
    DOCS -.->|fonte da verdade| WEB
```

| Repositório | Conteúdo | Stack |
|-------------|----------|-------|
| **`pcp-homol-api`** | NestJS, Prisma, `schema.prisma`, migrations, `docker-compose.yml` (PostgreSQL) | Node + PostgreSQL |
| **`pcp-homol-web`** | React + Vite, telas PCP | React |
| **`pcp-homol-migracao`** | Scripts `.DAT` → PostgreSQL, layouts, validadores | Node (CLI) |
| **`pcp-homol-docs`** | Pasta `docs/` inteira — decisões, escopo, modelo de dados | Markdown |

> **Alternativa aceitável:** manter `docs/` dentro de `pcp-homol-api` se preferir menos repositórios — mas backend e frontend **sempre separados**.

---

## Mapeamento: pasta atual → repositório futuro

| Caminho atual em `pcp-homol/` | Vai para |
|------------------------------|----------|
| `backend/` | `pcp-homol-api/` (raiz do repo) |
| `frontend/` | `pcp-homol-web/` (raiz do repo) |
| `tools/migracao/` | `pcp-homol-migracao/` (raiz do repo) |
| `docs/` | `pcp-homol-docs/` **ou** `pcp-homol-api/docs/` |
| `docker-compose.yml` | `pcp-homol-api/` (banco é dependência da API) |
| `.env.example` | Um por repositório (variáveis específicas) |
| `scripts/env-node.sh` | Cada repo documenta seu próprio Node; ou script em `migracao` |

---

## Variáveis de ambiente por repositório

### `pcp-homol-api`

```env
DATABASE_URL=postgresql://pcp:...@localhost:5432/pcp_homol
BACKEND_PORT=3001
CORS_ORIGIN=http://localhost:5175
JWT_SECRET=...
```

### `pcp-homol-web`

```env
VITE_API_URL=http://localhost:3000
```

### `pcp-homol-migracao`

```env
DATABASE_URL=postgresql://pcp:...@localhost:5432/pcp_homol
LEGACY_DATA_PATH=/Users/scominato/FANANDRI
```

A migração aponta para o **mesmo** PostgreSQL da API, mas vive em repo próprio.

---

## Contrato entre frontend e backend

- API REST em `/api/*`
- OpenAPI/Swagger (a adicionar na API) como contrato formal
- Frontend **não** acessa banco diretamente
- Versão da API comunicada via header ou `/api` info endpoint

---

**Status:** divisão executada em 09/07/2026 (repos locais). Próximo: publicar no GitHub/GitLab (C5 CI/CD).

---

## Plano de divisão (executado em 09/07/2026)

| Passo | Ação | Status |
|-------|------|--------|
| 1 | Criar 4 repositórios | ✅ Pastas locais |
| 2 | `backend/` → `pcp-homol-api` | ✅ |
| 3 | `frontend/` → `pcp-homol-web` | ✅ |
| 4 | `tools/migracao/` → `pcp-homol-migracao` | ✅ |
| 5 | `docs/` → `pcp-homol-docs` | ✅ |
| 6 | Ajustar paths Prisma na migração | ✅ |
| 7 | Publicar no remoto + CI/CD | ⬜ |
| 8 | Agrupar repos sob pasta `pcp-homol/` | ✅ (10/07/2026) |
| 9 | Remover pastas legadas `backend/`, `frontend/`, `tools/`, `docs/` | ✅ (10/07/2026) |

---

## O que NÃO fazer

- Não criar pacote npm compartilhado entre front e back só por conveniência (acopla de novo)
- Não colocar Prisma no frontend
- Não unificar migração dentro do backend em produção — só em dev se simplificar; ideal é repo `migracao` separado
