# 08 — Próximos passos

Ações na ordem recomendada. Atualize este arquivo conforme for concluindo.

---

## Onde estamos agora (10/07/2026)

| Dimensão | Situação |
|----------|----------|
| **Fase de homologação** | **Fase 5** (relatórios) concluída no código |
| **Desenvolvimento Fase 1** | ✅ API + telas produtos e matéria-prima |
| **Desenvolvimento Fase 2** | ✅ Migração, consulta, criação e emissão de OP |
| **Desenvolvimento Fase 3a** | 🔄 Migração + API + tela de baixas OP |
| **Homologação técnica Fase 2** | ✅ E5 concluído |
| **Aceite funcional FANANDRI** | ⬜ Pendente (Fase 1 e Fase 2) |
| **Próximo bloco de código** | Fase 6 — aceite final |
| **Desenvolvimento Fase 4** | ✅ Migração + API + telas programação |
| **Desenvolvimento Fase 3b** | ✅ Migração + API + tela baixa MP |

**Pasta do projeto:** todos os repositórios ficam em `/Users/scominato/pcp-homol/` (ver `04-estrutura-projeto.md`).

---

- ⬜ Pendente  
- 🔄 Em andamento / parcial  
- ✅ Concluído  

---

## Bloco A — Ambiente local

| # | Ação | Detalhe | Status |
|---|------|---------|--------|
| A1 | Node.js 20 | Portátil em `pcp-homol/.tools/node` (v20.19.2) — ou instalar globalmente | ✅ |
| A2 | Docker Desktop | Instalado; daemon em `/Applications/Docker.app/.../docker` | ✅ |
| A3 | PostgreSQL via Docker | `docker compose up -d` — container `pcp-homol-db` | ✅ |
| A4 | Dependências npm | `backend`, `frontend`, `tools/migracao` — `npm install` | ✅ |
| A5 | Build backend + frontend | `npm run build` sem erros | ✅ |
| A6 | Prisma migrate | Migration `20260708151518_init` aplicada | ✅ |
| A7 | Backend rodando | http://localhost:3000/api/health → `database: ok` | ✅ |
| A8 | Frontend rodando | http://localhost:5173 | ✅ |

### Comandos para subir de novo (dia a dia)

```bash
# 1. Docker (se não estiver aberto)
open -a Docker

# 2. Banco
export PATH="/Applications/Docker.app/Contents/Resources/bin:$PATH"
cd /Users/scominato/pcp-homol/pcp-homol-api
docker compose up -d

# 3. API (terminal 1)
cd /Users/scominato/pcp-homol/pcp-homol-api
export $(grep -v '^#' .env | xargs)
npm run start:dev

# 4. Frontend (terminal 2)
cd /Users/scominato/pcp-homol/pcp-homol-web
npm run dev
```

---

## Bloco B — Calibração da migração

| # | Ação | Detalhe | Status |
|---|------|---------|--------|
| B1 | Validar `PCPA28I.DAT` | 64 bytes/registro — **72.005 OPs** | ✅ |
| B2 | Validar `PCPA22I.DAT` | Lógico **391** bytes, passo físico **396**, offset **130** | ✅ |
| B3 | Validar `PCPA18I.DAT` | Lógico **287** bytes, passo físico **292**, offset **130** | ✅ |
| B3b | Validar `PCPA19I` / `PCPA20I` | Lógico 101/100 bytes, passo físico **104** (FK produtos) | ✅ |
| B4 | Carga `migrar:cadastros` | Grupos → classificações → produtos → MP | ✅ |
| B5 | Produtos no PostgreSQL | **1.834** gravados, 0 erros | ✅ |
| B6 | Matéria-prima no PostgreSQL | **3.298** gravados, 0 erros | ✅ |
| B7 | Exportar via `rebuild` (`POWER.BAT`) | Não necessário — leitura INDEXED calibrada | ✅ (dispensado) |
| B8 | Conferir totais com COBOL | Contagem manual no sistema legado vs. banco | ⬜ |

### Calibração INDEXED (09/07/2026)

Arquivos Micro Focus usam **passo físico** maior que o registro lógico do FD COBOL:

| Arquivo | Offset | Passo físico | Tamanho lógico | Registros |
|---------|--------|--------------|----------------|-----------|
| `PCPA19I.DAT` | 130 | 104 | 101 | 256 grupos |
| `PCPA20I.DAT` | 130 | 104 | 100 | 35 classificações |
| `PCPA18I.DAT` | 130 | 292 | 287 | 1.834 produtos |
| `PCPA22I.DAT` | 130 | 396 | 391 | 3.298 MPs |

Implementação: `tools/migracao/src/ler-indexed-dat.ts` + `npm run validar:indexed`.

### Resultado da migração em 09/07/2026

| Arquivo | Lidos | Gravados OK | Erros |
|---------|-------|-------------|-------|
| `PCPA19I.DAT` | 256 | 256 | 0 |
| `PCPA20I.DAT` | 35 | 35 | 0 |
| `PCPA18I.DAT` | 1.834 | 1.834 | 0 |
| `PCPA22I.DAT` | 3.298 | 3.298 | 0 |

**Próxima ação:** **B8** — conferir contagens e amostra de 10 itens no COBOL legado.

---

## Bloco C — Dividir repositórios (decisão: não monorepo)

| # | Ação | Detalhe | Status |
|---|------|---------|--------|
| C0 | Documentar estratégia | `11-repositorios-separados.md` | ✅ |
| C1 | Criar repo `pcp-homol-api` | `backend/` + `docker-compose.yml` + Prisma | ✅ |
| C2 | Criar repo `pcp-homol-web` | `frontend/` | ✅ |
| C3 | Criar repo `pcp-homol-migracao` | `tools/migracao/` | ✅ |
| C4 | Repo `pcp-homol-docs` separado | `docs/` → `pcp-homol/pcp-homol-docs` | ✅ |
| C5 | Ajustar CI/CD por repo | Build e deploy independentes | ⬜ |

> Repositórios locais em `/Users/scominato/pcp-homol/pcp-homol-{api,web,migracao,docs}`.  
> Pastas legadas do monorepo (`backend/`, `frontend/`, `tools/`, `docs/`) removidas em 10/07/2026.

---

## Bloco D — Desenvolvimento Fase 1 (cadastros)

| # | Ação | Detalhe | Status |
|---|------|---------|--------|
| D1 | API CRUD `Produto` | Módulo NestJS `produtos` | ✅ |
| D2 | API CRUD `MateriaPrima` | Módulo `materia-prima` | ✅ |
| D3 | API CRUD `Equipamento` + `Secao` | Módulos correspondentes | ✅ |
| D4 | Telas React — produtos | Rota `/produtos` | ✅ |
| D5 | Telas React — matéria-prima | Rota `/materia-prima` | ✅ |
| D6 | Homologação Fase 1 com cliente | `07-plano-homologacao.md` | ⬜ |

*Depende de B8 — conferência manual com o legado.*

---

## Bloco E — Fase 2 (OP)

| # | Ação | Status |
|---|------|--------|
| E1 | Schema processo (`PCPA70I`, `PCPA70XI`) | ✅ |
| E2 | Script `migrar:processo` + `migrar:ops` | ✅ |
| E3 | Engenharia reversa PC1028 + PC1041 | ✅ (`12-engenharia-reversa-op.md`) |
| E4 | API + telas ordem de produção (listagem/detalhe) | ✅ |
| E4b | Criação + emissão de OP (PC1028/PC1041) | ✅ |
| E5 | Homologação técnica Fase 2 | ✅ |

---

## Bloco F3 — Baixas de OP (Fase 3a)

| # | Ação | Status |
|---|------|--------|
| F3.1 | Engenharia reversa PC1132/PC1028 (`13-engenharia-reversa-baixas.md`) | ✅ |
| F3.2 | Schema Prisma + migration `baixas_op` | ✅ |
| F3.3 | Layouts `PCPA71I` + `PCPA132I` + calibração INDEXED | ✅ |
| F3.4 | Script `migrar:baixas` | ✅ (26.350 consolidadas + 20.825 por operação) |
| F3.5 | API: `GET /baixas`, `POST /baixas/operacao`, `POST /encerrar` | ✅ |
| F3.6 | Tela de baixas no detalhe da OP | ✅ |
| F3.7 | Homologação técnica Fase 3a | ⬜ |
| F3.8 | Aceite funcional FANANDRI | ⬜ |

---

## Bloco F3b — Baixa de MP (Fase 3b)

| # | Ação | Status |
|---|------|--------|
| F3b.1 | Engenharia reversa PC1076/PC1109 (`14-engenharia-reversa-baixa-mp.md`) | ✅ |
| F3b.2 | Schema Prisma + migration `baixas_mp` | ✅ |
| F3b.3 | Layouts `PCPA76I` + `PCPA109I` + calibração INDEXED | ✅ |
| F3b.4 | Script `migrar:baixas-mp` | ✅ (1.562 movimentos PCPA76I) |
| F3b.5 | API: `GET/POST /baixas-mp` + atualização estoque | ✅ |
| F3b.6 | Tela baixa MP no detalhe da OP | ✅ |
| F3b.7 | Homologação técnica Fase 3b | ⬜ |

---

## Bloco F4 — Programação (Fase 4)

| # | Ação | Status |
|---|------|--------|
| F4.1 | Engenharia reversa PC1066/PC1133 (`15-engenharia-reversa-programacao.md`) | ✅ |
| F4.2 | Layout `PCPA66I` + calibração INDEXED (passo 108) | ✅ |
| F4.3 | Script `migrar:programacao` | ✅ (1.383 registros) |
| F4.4 | API: listar, resumo, atrasos, criar, entrega | ✅ |
| F4.5 | Telas: lista, nova, detalhe + entrega | ✅ |
## Bloco F5 — Relatórios (Fase 5)

| # | Ação | Status |
|---|------|--------|
| F5.1 | Engenharia reversa PC1078/PC1071/PC1135/PC1059 (`16-engenharia-reversa-relatorios.md`) | ✅ |
| F5.2 | API: op abertas, op baixadas, produção setor, MP crítico, programação sintético | ✅ |
| F5.3 | Telas: hub `/relatorios` + relatórios com filtros e impressão | ✅ |
| F5.4 | Homologação técnica Fase 5 | ⬜ |

---

|---|------|------------|--------|
| F1 | Migração + API programação | Fase 4 | ✅ |
| F2 | Baixas OP e MP | Fase 3 | ✅ |
| F3 | Relatórios críticos | Fase 5 | ✅ |
| F4 | Aceite final FANANDRI | Fase 6 | ⬜ |

---

## O que fazer agora (resumo)

1. ~~Subir ambiente (Bloco A)~~ — **feito**
2. ~~Bloco B (migração cadastros)~~ — **feito** (falta B8: conferência manual COBOL)
3. ~~Bloco C (repos separados)~~ — **feito** (falta C5: CI/CD)
4. ~~Bloco E (processo + OP)~~ — **feito** (falta aceite funcional com FANANDRI)
5. **Bloco B8** — validar totais e amostra de 10 itens com o sistema legado
6. **Bloco D6** — homologação Fase 1 (cadastros) com FANANDRI
7. ~~**Bloco E5** — homologação técnica Fase 2 (OPs)~~ — **feito**; pendente só aceite funcional com FANANDRI
8. ~~**E4b** — implementar criação/emissão de OP conforme `12-engenharia-reversa-op.md`~~ — **feito**
9. ~~**Refino E2** — melhorar calibração `PCPA28E` (mais operações migradas)~~ — **feito** (passo 76)
10. **Bloco C5** — publicar repos no GitHub + CI/CD
11. ~~**Bloco F3a** — baixas de OP~~ — **feito**
12. ~~**Bloco F3b** — baixa de MP~~ — **feito**; falta homologação técnica (F3b.7)
13. ~~**Bloco F** — relatórios (Fase 5)~~ — **feito**
14. **Bloco F5.6** — homologação técnica relatórios + aceite FANANDRI
15. **Fase 6** — aceite final e documentação de usuário

| Arquivo | Offset | Passo físico | Lógico | Registros | Notas |
|---------|--------|--------------|--------|-----------|-------|
| `PCPA28I.DAT` | 130 | 64 | 62 | 72.000 | Cabeçalho OP |
| `PCPA28II.DAT` | 130 | 172 | 168 | 79.796 | Cliente OP |
| `PCPA28E.DAT` | 130 | 76 | 74 | 125.549 | Operações OP (overhead 2 bytes) |
| `PCPA71I.DAT` | 130 | 312 | 310 | 26.353 | Baixa consolidada OP |
| `PCPA132I.DAT` | 130 | 204 | 194 | 71.429 | Baixa por operação |
| `PCPA76I.DAT` | 130 | 76 | 66 | 1.563 | Movimento MP |
| `PCPA109I.DAT` | 130 | 54 | 54 | 1 | Baixa MP por OP |
| `PCPA66I.DAT` | 130 | 108 | 105 | 1.383 | Programação entregas |
| `PCPA70I.DAT` | 130 | 150 | 146 | 1.829 | Processo (enriquecimento) |
| `PCPA70XI.DAT` | 128 | 672 | 668 | 12.618 | Roteiro (`skipIndiceBytes=2`) |

**Descoberta:** `OP-PRODUTO` e `PROCESSO-PRODUTO` usam o **desenho do cliente** (ex.: `90531014`), não o código `001-01-00001`.

### Resultado migração processo + OP (09/07/2026)

| Entidade | Gravados |
|----------|----------|
| Processos produtivos | 1.794 |
| Operações de processo | 12.312 |
| Ordens de produção | 72.000 |
| Operações de OP | **125.244** |

> **Refino 09/07/2026:** `PCPA28E` estava com `passoFisico=78` (incorreto). Corrigido para **76** (74 lógico + 2 overhead, mesmo padrão de `PCPA28I`). Antes: 5.097 operações. Ignorados: 305 (órfãos sem OP pai ou slots vazios).

---

## Registro de progresso

| Data | O que foi feito |
|------|-----------------|
| Jul/2026 | Projeto `pcp-homol` criado; documentação `docs/` estruturada |
| Jul/2026 | Node portátil v20 em `.tools/node`; `npm install` nos 3 pacotes; builds OK |
| 08/07/2026 | Docker Desktop instalado e iniciado; PostgreSQL container `pcp-homol-db` |
| 08/07/2026 | Prisma migration `init` aplicada; tabelas criadas |
| 08/07/2026 | Backend e frontend rodando; health `database: ok` |
| 08/07/2026 | `PCPA28I` validado (64 bytes); primeira `migrar:cadastros` (parcial) |
| 09/07/2026 | Calibração INDEXED; migração cadastros OK: 256 grupos, 35 classif., 1.834 produtos, 3.298 MPs |
| 09/07/2026 | **Bloco C** — repos `pcp-homol-api`, `pcp-homol-web`, `pcp-homol-migracao`, `pcp-homol-docs` |
| 09/07/2026 | **Bloco E3** — engenharia reversa PC1028/PC1041 (`12-engenharia-reversa-op.md`) |
| 09/07/2026 | **Refino PCPA28E** — calibração `passoFisico` 78→76; migração de 125.244 operações de OP |
| 09/07/2026 | **E5** — homologação técnica OP: API, frontend, criação, emissão, bloqueio de OP baixada e consistência de dados |
| 10/07/2026 | **Reorganização** — repos `pcp-homol-*` movidos para dentro de `/Users/scominato/pcp-homol/`; pastas legadas do monorepo removidas; sistema revalidado (API, frontend, migração) |
| 10/07/2026 | **Fase 3a** — baixas OP: doc 13, schema/migration, `migrar:baixas`, API e tela no detalhe da OP |
| 10/07/2026 | **Fase 3b** — baixa MP: doc 14, schema/migration, `migrar:baixas-mp`, API e tela no detalhe da OP |
| 10/07/2026 | **Fase 4** — programação: doc 15, `migrar:programacao`, API e telas de programação |
| 10/07/2026 | **Fase 5** — relatórios: doc 16, API `/relatorios/*` e telas no frontend |
