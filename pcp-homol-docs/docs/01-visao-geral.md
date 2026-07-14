# 01 — Visão geral

## O que é este projeto?

O **pcp-homol** é um sistema web moderno para substituir o módulo de **PCP (Planejamento e Controle da Produção)** do ERP legado da FANANDRI.

Ele é um **projeto independente do Synex**, criado para:

1. Migrar a lógica e os dados do COBOL para tecnologias atuais
2. Homologar com o cliente em ambiente controlado
3. Só depois incorporar o que foi validado ao produto Synex (SaaS multi-tenant)

---

## Contexto do sistema legado

| Aspecto | Detalhe |
|---------|---------|
| **Empresa** | Indústria Metalúrgica FANANDRI Ltda. (Mooca, SP) |
| **Linguagem** | COBOL (Micro Focus COBOL 4.5), rodando em DOS/Windows |
| **Desenvolvedora original** | InfoExpress Informática — Cleusa C. Silva (desde ~1995) |
| **Pasta em uso** | `/Users/scominato/FANANDRI` |
| **Armazenamento** | ~212 programas `.COB`, ~1.459 arquivos `.DAT`, ~1.052 `.IDX` |
| **Entrada do sistema** | `MENU.BAT` → `PCP.EXE` → menus por senha (`PC1000.COB`) |

O legado é um **ERP industrial completo** (financeiro, faturamento, fiscal, compras, produção, programação). **Neste projeto tratamos apenas o PCP.**

---

## O que é PCP neste contexto?

Na FANANDRI, PCP não é só “um menu” — é o conjunto de processos que governam:

- **O que** produzir (produtos, desenhos, processo)
- **Com que** produzir (matéria-prima, ferramentas, equipamentos)
- **Quando** produzir (programação de entregas)
- **Como** acompanhar (ordens de produção, baixas, relatórios)

No código COBOL, isso se espalha pelos menus:

- **PRODUÇÃO** (`INICIO-P` no `PC1000.COB`)
- **PROGRAMAÇÃO** (`INICIO-G`)
- **ALMOXARIFADO** de matéria-prima (`INICIO-ALMOX`) — parte usada pelo PCP

---

## Objetivo de negócio

O cliente deve conseguir **parar de usar o COBOL para o PCP** após homologar este sistema, mantendo:

- Os mesmos dados históricos
- As mesmas regras operacionais
- Paridade nos relatórios e consultas críticos

---

## Analogia para entender a jornada

| Etapa | Analogia |
|-------|----------|
| Sistema COBOL | Casa antiga com toda a história da família |
| `pcp-homol` | Reforma de um andar (PCP) para morar e testar |
| Homologação | Cliente mora no andar reformado e aponta ajustes |
| Synex | Condomínio novo onde o andar reformado vira modelo para outros clientes |

---

## Onde estamos hoje (Jul/2026)

| Fase | Situação |
|------|----------|
| 0 — Fundação | ✅ Concluída |
| 1 — Cadastros | Desenvolvimento ✅ · aceite cliente ⬜ |
| 2 — Processo + OP | Desenvolvimento ✅ · aceite cliente ⬜ |
| 3 em diante | Não iniciadas |

Detalhes atualizados: [08-proximos-passos.md](08-proximos-passos.md) e [07-plano-homologacao.md](07-plano-homologacao.md).
