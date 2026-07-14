# pcp-homol-migracao

Ferramenta CLI para migrar arquivos `.DAT` do COBOL (Micro Focus) para o PostgreSQL da API.

> **Não vai para produção** — roda poucas vezes na homologação e no corte de dados.

## Repositórios relacionados

| Repo | Função |
|------|--------|
| [pcp-homol-api](../pcp-homol-api) | Dono do `schema.prisma` e das migrations |
| [pcp-homol-docs](../pcp-homol-docs) | Layouts e calibração INDEXED |

## Pré-requisitos

- Node.js 20+
- PostgreSQL rodando (`docker compose up -d` na API)
- Migrations aplicadas na API (`npx prisma migrate dev`)
- Pasta legada em `LEGACY_DATA_PATH` (padrão: `/Users/scominato/FANANDRI`)

## Primeira execução

```bash
cp .env.example .env
npm install
npm run prisma:generate
npm run migrar:cadastros
```

## Scripts

| Comando | Descrição |
|---------|-----------|
| `npm run migrar:cadastros` | Grupos, classificações, produtos e matéria-prima |
| `npm run validar:indexed` | Valida calibração INDEXED (`PCPA18I`, `PCPA22I`) |
| `npm run validar:arquivo` | Valida tamanho sequencial (`PCPA28I.DAT 64`) |
| `npm run prisma:generate` | Regenera cliente Prisma |

## Schema Prisma

O arquivo `prisma/schema.prisma` é uma **cópia** do repositório `pcp-homol-api`.  
Quando o schema mudar na API, copie novamente antes de rodar a migração de dados.

## Documentação

Calibração INDEXED e ordem de carga: **[06-migracao-dados-legados.md](../pcp-homol-docs/docs/06-migracao-dados-legados.md)**
