# 07 — Plano de homologação

Roadmap para o cliente FANANDRI aceitar o sistema novo como substituto do PCP legado.

---

## Objetivo da homologação

O usuário-chave da FANANDRI consegue executar **todo o ciclo PCP** no sistema web, com **dados reais migrados**, obtendo resultados equivalentes ao COBOL.

**Aceite formal** = assinatura ou e-mail documentando que a fase está OK.

---

## Fases

| Fase | Nome | Entrega técnica | Validação com cliente |
|------|------|-----------------|------------------------|
| **0** | Fundação | Projeto, banco, docs, migração cadastros | Contagem produtos/MP bate com legado |
| **1** | Cadastros | CRUD produtos, MP, equipamentos, seções, desenhos | Cadastros conferidos campo a campo |
| **2** | Processo + OP | Processo produtivo; criar, listar, emitir OP | OP aberta igual PC1028/PC1041 |
| **3** | Baixas | Baixa operações OP + baixa MP | Estoque reflete produção |
| **4** | Programação | Gerar, consultar, saldo, atrasos | Programação mensal/diária OK |
| **5** | Relatórios | OP aberta, por setor, sintéticos, compras MP | Paridade com relatórios COBOL |
| **6** | Aceite final | Correções da homologação; documentação usuário | Aceite formal — PCP no sistema novo |

---

## Critérios de aceite (cada fase)

Para **cada** funcionalidade entregue:

1. **Contagem** — Mesmo número de registros (±0) após migração
2. **Amostra** — 10 itens conferidos campo a campo com o legado
3. **Fluxo** — Usuário-chave executa operação real sem bloqueio
4. **Relatório** — Saída equivale ao impresso/exportado do COBOL (quando aplicável)

---

## Resultado técnico — Fase 3a (Baixas de OP)

Validação executada em 10/07/2026 no ambiente `pcp-homol`.

| Critério | Resultado |
|----------|-----------|
| Engenharia reversa | `13-engenharia-reversa-baixas.md` — PC1132 (`PCPA132I`) e PC1028 baixa (`PCPA71I`) |
| Migração consolidada | 26.350 registros de `PCPA71I` (passo 312, lógico 310) |
| Migração por operação | 20.825 registros de `PCPA132I` (passo 204, lógico 194) |
| API | `GET /baixas`, `POST /baixas/operacao`, `POST /encerrar` |
| Frontend | Seção de baixas no detalhe da OP (baixar operação + encerrar) |
| Regra legado | OP baixada bloqueia nova baixa de operação e encerramento duplicado |

**Pendência:** homologação técnica F3.7/F3b.7 (amostra campo a campo) e aceite FANANDRI.

---

---

## Resultado técnico — Fase 4 (Programação)

Validação executada em 10/07/2026.

| Critério | Resultado |
|----------|-----------|
| Engenharia reversa | `15-engenharia-reversa-programacao.md` |
| Migração PCPA66I | 1.383 registros (passo 108, lógico 105) |
| API | CRUD + resumo + atrasos + registrar entrega |
| Frontend | Lista com filtros, aba atrasos, nova programação, detalhe |

---

## Resultado técnico — Fase 5 (Relatórios)

Validação executada em 10/07/2026.

| Critério | Resultado |
|----------|-----------|
| Engenharia reversa | `16-engenharia-reversa-relatorios.md` — PC1078, PC1071, PC1135, PC1059, PC1067 |
| API | `GET /relatorios/op-abertas`, `op-baixadas`, `producao-setor`, `mp-estoque-critico`, `programacao-sintetico` |
| Frontend | Hub `/relatorios` + telas por relatório com filtros, totais e impressão |

**Pendência:** homologação técnica F5.6 (amostra campo a campo) e aceite FANANDRI.

---

## Resultado técnico — Fase 3b (Baixa de MP)

Validação executada em 10/07/2026.

| Critério | Resultado |
|----------|-----------|
| Engenharia reversa | `14-engenharia-reversa-baixa-mp.md` |
| Migração PCPA76I | 1.562 movimentos (passo 76, lógico 66) |
| Migração PCPA109I | 0 (arquivo legado quase vazio) |
| API | `GET/POST /baixas-mp` + débito em `MateriaPrima.quantidade` |
| Frontend | Seção baixa MP com MPs do roteiro |

---

## Resultado técnico — Fase 2 (Processo + OP)

Validação executada em 09/07/2026 no ambiente `pcp-homol`.

| Critério | Resultado |
|----------|-----------|
| Migração OP | 72.000 cabeçalhos de OP migrados |
| Operações OP | 125.244 operações migradas de `PCPA28E` após refino do passo físico 76 |
| Integridade | 0 duplicidades por OP/operação; 0 operações fora da faixa 1–25 |
| API | Listagem, detalhe, próximo código, preparação de criação, criação, emissão e exclusão testados |
| Frontend | Listagem, detalhe, formulário de nova OP, busca de roteiro e emissão testados |
| Regra legado | Emissão de OP baixada bloqueada, conforme PC1041 |

**Amostras técnicas usadas:**

- OP `00000001` — validada no detalhe; possui operações migradas e cliente `VOLKSWAGEN DO BRASIL LTDA.`
- OP aberta `79814` — validada na emissão web com roteiro de produção.
- Desenho `90531014` — validado na criação de OP; carrega produto `*** SUPORTE FILTRO DE AR` e 8 operações do roteiro.

**Pendência de aceite funcional:** usuário-chave da FANANDRI deve conferir uma amostra manual no COBOL (especialmente OPs abertas e uma emissão impressa) antes do aceite formal.

---

## Participantes sugeridos

| Papel | Responsabilidade na homologação |
|-------|--------------------------------|
| Você (líder) | Regras de negócio, priorização, aceite funcional |
| Usuário-chave FANANDRI | Testar fluxos reais do dia a dia |
| Desenvolvimento (IA/equipe) | Implementar, migrar, corrigir |
| Especialista legado (ex.: Cleusa) | Esclarecer regras não óbvias no COBOL |

---

## Convivência com o legado

Enquanto homologamos:

| Sistema | Papel |
|---------|-------|
| COBOL (legado) | Continua em produção — fonte de verdade |
| pcp-homol | Ambiente de teste com cópia migrada dos `.DAT` |

**Regra:** não atualizar os mesmos registros nos dois sistemas ao mesmo tempo durante testes — gera divergência.

**Corte (futuro):** definir data em que o PCP deixa de ser alimentado no COBOL (ver decisões pendentes em `02-decisoes-arquitetura.md`).

---

## Riscos e mitigação

| Risco | Mitigação |
|-------|-----------|
| Layout `.DAT` incorreto | `validar:arquivo` + amostra manual |
| Regra de negócio oculta no COBOL | Ler programa fonte + validar com especialista |
| Escopo crescer demais | Manter `03-escopo-pcp.md` como limite |
| Divergência pós-migração | `MigracaoLog` + relatório de diferenças |

---

## Após homologação — incorporação Synex

Ver `09-relacao-synex.md`.

O ativo principal exportado para o Synex:

- Modelo de dados validado
- Regras de negócio documentadas e testadas
- Aceite do cliente como prova de paridade
