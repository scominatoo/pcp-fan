# 13 — Engenharia reversa: Baixas de OP (Fase 3)

Documento gerado a partir dos fontes COBOL em `/Users/scominato/FANANDRI/FONTES/`.

**Programas analisados:**

| Programa | Menu | Função |
|----------|------|--------|
| **PC1132** | Produção 112 | Baixa de **operações** da OP (por setor/operação) |
| **PC1028** | Produção 107 opção 5 | Baixa **consolidada** da OP (`ENTRA-BAIXA-OP`) |
| **PC1076** | Produção 117 | Baixa de matéria-prima (movimento) — **Fase 3b** |
| **PC1109** | Produção 100 | Baixa de MP (outro fluxo) — **Fase 3b** |

---

## 1. Dois arquivos diferentes (atenção!)

No legado existem **dois conceitos** de “baixa de OP”:

| Arquivo | Programa | Granularidade | Conteúdo |
|---------|----------|---------------|----------|
| **`PCPA132I.DAT`** | PC1132 | Por **operação** (OP + nº operação) | Tempos, equipamento, quantidades produzidas |
| **`PCPA71I.DAT`** | PC1028 | Por **OP** (cabeçalho único) | Peças totais, MP, rolos, tempos por operação (25 slots) |

> A documentação antiga citava só `PCPA71I` para PC1132 — isso estava **incorreto**. O PC1132 grava em **`PCPA132I`**.

---

## 2. PC1132 — Baixa de operação (`PCPA132I`)

### Chave do registro

`(BAIXA-OP-CODIGO, BAIXA-OP-OPERACAO, SPACES)` — 8 + 2 + 2 bytes.

### Campos principais (194 bytes lógicos)

| Campo | Significado |
|-------|-------------|
| Data/hora início e fim | Período da produção na operação |
| Tempo total | Calculado pelo programa (`CALCULA-TEMPO`) |
| Equipamento | Grupo + código |
| Qtde saída / entrada | Peças produzidas na operação |
| Peso saída / entrada | Quando aplicável |
| `ATUALIZOU-EST` | `S` se entrou peça no estoque do produto |

### Regras observadas

1. OP deve existir em `PCPA28I`.
2. Operação deve existir no roteiro (`PCPA70XI`) e na OP (`PCPA28E`).
3. Operador informa quantidade produzida na operação.
4. Gravação: `REWRITE` ou `WRITE` em `PCPA132I`.
5. Atualização de estoque do produto (`PCPA106I`) aparece **comentada** em trechos do fonte — homologar com FANANDRI se ainda é usada.

### Calibração INDEXED (10/07/2026)

| Parâmetro | Valor |
|-----------|-------|
| Offset | 130 |
| Passo físico | **204** |
| Tamanho lógico | 194 |
| Slots | ~73.967 |
| Registros válidos (amostra) | ~20.811 |

---

## 3. PC1028 — Baixa consolidada (`PCPA71I`)

Rotina `ENTRA-BAIXA-OP` (menu opção 5 — Baixa):

1. Carrega ou zera registro em `PCPA71I` pela chave `OP-CODIGO`.
2. Operador informa data, MP consumida, rolos, tempos por operação.
3. `VERIFICA-BAIXA-TOTAL` compara tempos/peças com o roteiro.
4. Grava `PCPA71I` e pode atualizar flags em `PCPA28I`:
   - `OP-BAIXADA`
   - `OP-BAIXADA-MP`
   - `OP-BAIXADA-PRODUTO`

### Layout lógico (310 bytes)

| Bloco | Tamanho |
|-------|---------|
| Código OP | 8 |
| Data + hora baixa | 12 |
| Peças, MP, rolos | 16 |
| Tempos prep/prod × 25 operações | 250 |
| Turnos 1 e 2 | 12 |
| Filler | 12 |

### Calibração INDEXED (10/07/2026)

| Parâmetro | Valor |
|-----------|-------|
| Offset | 130 |
| Passo físico | **312** |
| Tamanho lógico | 310 |
| Slots | ~26.352 |
| Registros com OP pai válida | ~26.349 |

---

## 4. Flags no cabeçalho da OP (`PCPA28I`)

| Flag COBOL | Campo Prisma | Significado |
|------------|--------------|-------------|
| `OP-BAIXADA` | `baixada` | OP encerrada |
| `OP-BAIXADA-MP` | `baixadaMp` | MP da OP baixada |
| `OP-BAIXADA-PRODUTO` | `baixadaProduto` | Produto acabado baixado |

**Regra já implementada:** OP `baixada` bloqueia alteração, exclusão e emissão (PC1041 ignora OP baixada).

---

## 5. O que implementar no sistema novo (Fase 3)

### Fase 3a — Baixas de OP (este bloco)

| Funcionalidade | Prioridade | Referência |
|----------------|------------|------------|
| Migrar `PCPA132I` e `PCPA71I` | Alta | Calibração acima |
| API: baixar operação | Alta | PC1132 |
| API: encerrar OP (flags + consolidada) | Alta | PC1028 `ENTRA-BAIXA-OP` |
| Tela: baixas no detalhe da OP | Alta | — |
| Atualizar `dataEncerramento` na operação | Média | `PCPA28E` |

**Status implementação (10/07/2026):** itens acima ✅ concluídos no código; pendente homologação técnica e aceite FANANDRI.

### Fase 3b — Baixa de MP

| Funcionalidade | Arquivo | Programa |
|----------------|---------|----------|
| Movimento de MP | `PCPA76I` | PC1076 |
| Baixa MP simplificada | `PCPA109I` | PC1109 |

**Status implementação (10/07/2026):** ✅ concluído no código — ver doc 14.

---

## 6. Endpoints sugeridos

```text
GET  /ordens-producao/:id/baixas          → consolidada + operações baixadas
POST /ordens-producao/:id/baixas/operacao → baixa uma operação (PC1132)
POST /ordens-producao/:id/encerrar        → flags + registro consolidado (PC1028)
```

---

*Documento criado em 10/07/2026 — Fase 3a implementada no código em 10/07/2026.*
