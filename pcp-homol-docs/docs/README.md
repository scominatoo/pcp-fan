# Documentação — PCP Homologação (fonte da verdade)

Esta pasta `docs/` é a **memória de longo prazo** do projeto `pcp-homol`.  
Toda decisão de arquitetura, escopo, modelo de dados e plano de execução deve ser registrada aqui antes de ser implementada.

> **Cliente:** Indústria Metalúrgica FANANDRI Ltda.  
> **Sistema legado:** COBOL/DOS em `/Users/scominato/FANANDRI`  
> **Objetivo:** Homologar o módulo PCP completo antes de incorporar ao Synex.

---

## Índice

| # | Documento | Conteúdo |
|---|-----------|----------|
| 01 | [Visão geral](01-visao-geral.md) | Contexto, objetivo, história do legado |
| 02 | [Decisões de arquitetura](02-decisoes-arquitetura.md) | Stack, escopo, fonte de dados — o que decidimos |
| 03 | [Escopo do módulo PCP](03-escopo-pcp.md) | Menus, programas COBOL, fluxos de negócio |
| 04 | [Estrutura do projeto](04-estrutura-projeto.md) | Pastas, como subir, variáveis de ambiente |
| 05 | [Modelo de dados](05-modelo-dados.md) | Arquivos `.DAT` → tabelas PostgreSQL |
| 06 | [Migração dos dados legados](06-migracao-dados-legados.md) | Como extrair `.DAT`/`.IDX` para o banco novo |
| 07 | [Plano de homologação](07-plano-homologacao.md) | Fases, critérios de aceite com o cliente |
| 08 | [Próximos passos](08-proximos-passos.md) | Ações imediatas e ordem de execução |
| 09 | [Relação com o Synex](09-relacao-synex.md) | Por que projeto separado e como incorporar depois |
| 10 | [Referência do sistema legado](10-sistema-legado-referencia.md) | Resumo técnico do COBOL analisado |
| 11 | [Repositórios separados](11-repositorios-separados.md) | **Não monorepo** — divisão api / web / migracao |
| 12 | [Engenharia reversa OP](12-engenharia-reversa-op.md) | Regras PC1028 (cadastro) e PC1041 (emissão) |
| 13 | [Engenharia reversa baixas OP](13-engenharia-reversa-baixas.md) | Regras PC1132 (operação) e PC1028 baixa (consolidada) |
| 14 | [Engenharia reversa baixa MP](14-engenharia-reversa-baixa-mp.md) | Regras PC1076 (movimento) e PC1109 (baixa na OP) |
| 15 | [Engenharia reversa programação](15-engenharia-reversa-programacao.md) | Regras PC1066 e PC1133 (`PCPA66I`) |
| 16 | [Engenharia reversa relatórios](16-engenharia-reversa-relatorios.md) | Regras PC1078, PC1071, PC1135, PC1059, PC1067 |
| 17 | Checklist homologação cliente | `17-checklist-homologacao-cliente.docx` — validação com FANANDRI |
| 18 | Manual do usuário | `18-manual-usuario-pcp-homol.docx` — passo a passo de uso do sistema |

---

## Regras desta documentação

1. **Decidiu algo novo?** Atualize o arquivo correspondente (principalmente `02-decisoes-arquitetura.md`).
2. **Mudou o schema do banco?** Atualize `05-modelo-dados.md` e `backend/prisma/schema.prisma`.
3. **Novo programa COBOL mapeado?** Atualize `03-escopo-pcp.md`.
4. **Concluiu uma fase?** Marque em `07-plano-homologacao.md` e `08-proximos-passos.md`.

---

## Status atual do projeto

**Atualizado em 10/07/2026**

### Onde estamos na homologação

| Fase | Nome | Desenvolvimento | Aceite cliente |
|------|------|-----------------|----------------|
| 0 | Fundação | ✅ | — |
| 1 | Cadastros | ✅ | ⬜ pendente (B8 + D6) |
| 2 | Processo + OP | ✅ | ⬜ pendente |
| 3 | Baixas | ✅ | ⬜ |
| 4 | Programação | ✅ | ⬜ |
| 5 | Relatórios | ✅ | ⬜ |
| 6 | Aceite final | ⬜ | ⬜ |

**Resumo:** Fase 5 (relatórios) concluída no código; próximo bloco é **Fase 6** (aceite final). Aceite FANANDRI pendente para Fases 1–5.

### Entregas já concluídas

| Item | Status |
|------|--------|
| Repositórios separados sob `pcp-homol/` | ✅ |
| Docker + PostgreSQL | ✅ |
| Migração cadastros (grupos, classif., produtos, MP) | ✅ |
| Migração Pacote A (desenhos, seções, equipamentos) | ✅ |
| Migração processo + OP (125.244 operações) | ✅ |
| Migração Pacote B (ferramentas + complemento processo) | ✅ |
| Migração Pacote C (complemento MP + clientes) | ✅ |
| Migração Pacote D (pedidos, NRMP, saldo) | ✅ |
| API + telas cadastros (Fase 1) | ✅ |
| API + telas OP + criação + emissão (Fase 2) | ✅ |
| Homologação técnica Fase 2 (E5) | ✅ |
| Migração + API + tela baixas OP (Fase 3a) | ✅ |
| Migração + API + tela baixa MP (Fase 3b) | ✅ |
| Migração + API + telas programação (Fase 4) | ✅ |
| API + telas relatórios (Fase 5) | ✅ |
| CI/CD GitHub | ⬜ pendente (C5) |
| Homologação funcional com cliente | ⬜ pendente |

Mapa detalhado arquivo → tabela: [05-modelo-dados.md](05-modelo-dados.md).

### Próximas ações

1. **B8** — conferir totais e amostra no COBOL legado  
2. **D6** — homologação Fase 1 (cadastros) com FANANDRI  
3. **Aceite Fase 2** — amostra de OPs no legado vs sistema novo  
4. **C5** — publicar repos no GitHub + CI/CD  

Ver detalhes em [08-proximos-passos.md](08-proximos-passos.md).
