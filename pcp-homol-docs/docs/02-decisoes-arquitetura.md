# 02 — Decisões de arquitetura

Registro de **todas as decisões** tomadas até aqui. Se algo mudar, atualize este arquivo.

---

## Decisão 1 — Projeto separado do Synex

| | |
|---|---|
| **Decisão** | Criar repositório `pcp-homol` independente do Synex |
| **Motivo** | Homologar com a FANANDRI antes de generalizar como SaaS |
| **Consequência** | Stack pode diferir do Synex nesta fase; incorporação é fase posterior |
| **Data** | Julho/2026 |

---

## Decisão 2 — Stack tecnológica do piloto

| Camada | Tecnologia | Observação |
|--------|------------|------------|
| Backend | **Node.js + TypeScript + NestJS** | API REST modular |
| Frontend | **React + Vite + TypeScript** | SPA web |
| Banco | **PostgreSQL 16** | Mesma família do Synex |
| ORM | **Prisma** | Migrations versionadas |
| Infra local | **Docker Compose** | Apenas PostgreSQL no container |
| Auth (futuro) | JWT + perfis | Substituir senhas fixas do COBOL |

> O Synex usa Django/Python. Esta diferença é **intencional** no piloto. Na incorporação, portamos regras validadas — não necessariamente o código Node linha a linha.

---

## Decisão 3 — Local e nome do projeto

| | |
|---|---|
| **Caminho** | `/Users/scominato/pcp-homol` |
| **Nome da pasta** | `pcp-homol` (homologação) |
| **Subpastas ativas** | `pcp-homol-api`, `pcp-homol-web`, `pcp-homol-migracao`, `pcp-homol-docs` |

---

## Decisão 4 — Escopo funcional

| Incluído | Excluído (por enquanto) |
|----------|-------------------------|
| Todo o módulo PCP | Faturamento |
| Programação de entregas | Fiscal (ICMS, IPI, DARF) |
| Almoxarifado de MP usado pelo PCP | Fluxo de caixa / duplicatas |
| Compras de MP ligadas ao PCP (requisição, posição) | Remessa bancária |
| Cadastros compartilhados necessários ao PCP | Módulo condomínio |

**Resposta do cliente:** programação **entra** no PCP; **toda** a parte PCP é prioridade.

---

## Decisão 5 — Fonte de dados para migração

| | |
|---|---|
| **Decisão** | Usar os `.DAT`/`.IDX` da pasta **em uso hoje** (`/Users/scominato/FANANDRI`) |
| **Motivo** | Sistema COBOL ainda roda; esses são os dados mais atuais |
| **Não usar** | Backups antigos (`BACKUP20251107`, `backup20230111`, etc.) como fonte primária |

Variável de ambiente: `LEGACY_DATA_PATH=/Users/scominato/FANANDRI`

---

## Decisão 6 — Estratégia de migração de dados

| | |
|---|---|
| **Abordagem** | Engenharia reversa dos `FD` COBOL → schema PostgreSQL → scripts Node em `tools/migracao/` |
| **Não fazer** | Traduzir COBOL linha a linha para TypeScript |
| **Fazer** | Extrair **regras de negócio** e **reimplementar** com testes |
| **Validação** | Comparar totais e amostras com o sistema legado ainda em execução |

**Descoberta técnica:** arquivos `.DAT` são **INDEXED** (Micro Focus), não texto sequencial simples. Ex.: `PCPA28I.DAT` tem registro físico de **64 bytes** (62 de dados + 2 de controle). Calibrar layouts antes de cada carga.

---

## Decisão 7 — Documentação como fonte da verdade

| | |
|---|---|
| **Decisão** | Pasta `docs/` na raiz do `pcp-homol` concentra decisões, escopo e plano |
| **Mesmo princípio do Synex** | Antes de implementar algo complexo, consultar e atualizar `docs/` |

---

## Decisão 8 — Emissão fiscal

| | |
|---|---|
| **Decisão** | Não desenvolver emissão fiscal neste piloto |
| **Alinhamento Synex** | Fiscal será via API de parceiro no produto final |

O PCP pode **referenciar** pedidos e notas, mas NF não é escopo desta homologação.

---

## Decisão 9 — Repositórios separados (não monorepo)

| | |
|---|---|
| **Decisão** | **Não usar monorepo** — backend, frontend e migração em repositórios Git distintos |
| **Motivo** | Deploy, versionamento e evolução independentes; front não acoplado ao back |
| **Estado atual** | Pasta única `pcp-homol/` — workspace temporário de bootstrap |
| **Estado alvo** | Subpastas `pcp-homol-*` dentro de `/Users/scominato/pcp-homol/`, cada uma com repo Git próprio |
| **Detalhes** | Ver `11-repositorios-separados.md` |
| **Data** | Julho/2026 |

---

## Decisão 10 — Ambiente local instalado (08/07/2026)

| Componente | Status |
|------------|--------|
| Docker Desktop 29.6 | ✅ Instalado e rodando |
| PostgreSQL 16 (container `pcp-homol-db`) | ✅ |
| Node.js 20.19.2 (portátil em `.tools/node`) | ✅ |
| Backend NestJS — dependências + build + migrate | ✅ |
| Frontend React — dependências + build | ✅ |
| API health `database: ok` | ✅ |
| Frontend http://localhost:5173 | ✅ |
| Migração cadastros | 🔄 Parcial (ver `08-proximos-passos.md` Bloco B) |

---

## Decisões pendentes (a definir com o cliente)

| # | Tema | Opções |
|---|------|--------|
| 1 | Usuários e perfis | Quais funções da FANANDRI acessam cada área do PCP? |
| 2 | Impressão de OP | PDF igual ao layout COBOL ou layout novo? |
| 3 | Convivência | COBOL e sistema novo rodam em paralelo por quanto tempo? |
| 4 | Corte | Data em que o PCP deixa de ser atualizado no legado |
