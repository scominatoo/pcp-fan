# 14 — Engenharia reversa: Baixa de matéria-prima (Fase 3b)

Documento gerado a partir dos fontes COBOL em `/Users/scominato/FANANDRI/FONTES/`.

**Programas analisados:**

| Programa | Menu | Função |
|----------|------|--------|
| **PC1076** | Produção 117 | Movimento de MP por lote NRMP (baixa `B` / reversão `R`) |
| **PC1109** | Produção 100 | Baixa simplificada de MP vinculada à OP |

---

## 1. Dois fluxos no legado

| Arquivo | Programa | Granularidade | Uso principal |
|---------|----------|---------------|---------------|
| **`PCPA76I.DAT`** | PC1076 | Por **lote NRMP** + índice | Histórico de movimentos de estoque MP |
| **`PCPA109I.DAT`** | PC1109 | Por **OP** (código 8 dígitos) | Baixa de MP na produção (1 MP por registro) |

> O PC1076 atualiza o saldo em `PCPA22I.DAT` (cadastro de MP). O PC1109 grava em `PCPA109I` e também debita `PCPA22I`.

---

## 2. PC1076 — Movimento de MP (`PCPA76I`)

### Chave do registro (`MV-CHAVE`)

| Campo | Tamanho | Significado |
|-------|---------|-------------|
| `MV-LETRA` + `MV-NUMERO` + `MV-LETRA2` | 10 | Código do lote NRMP |
| `MV-INDICE` | 9 | Sequencial do movimento no lote |
| `MV-TIPO` | 1 | `B` = baixa, `R` = reversão/entrada |
| `MV-DATA` | 8 | Data do movimento |
| `MV-NOTA` | 8 | Nota/requisição associada |

### Demais campos (66 bytes lógicos)

| Campo | Significado |
|-------|-------------|
| `MV-PRIMA` | Classe + item da MP |
| `MV-QTDE-ROLO` | Quantidade de rolos |
| `MV-QTDE` | Quantidade (S9(06)V99) |
| `MV-FLAG` | Flags auxiliares |

### Calibração INDEXED (10/07/2026)

| Parâmetro | Valor |
|-----------|-------|
| Offset | 130 |
| Passo físico | **76** |
| Tamanho lógico | 66 |
| Registros válidos | ~1.562 (1.523 tipo B, 38 tipo R) |

---

## 3. PC1109 — Baixa de MP na OP (`PCPA109I`)

### Chave

`MV-CODIGO` = número da **OP** (8 dígitos).

### Layout (54 bytes lógicos)

| Campo | Significado |
|-------|-------------|
| `MV-CODIGO` | Código da OP |
| `MV-PRIMA` | MP consumida |
| `MV-QTDE-ROLO` | Rolos |
| `MV-QTDE` | Quantidade baixada |
| `MV-DATA` | Data da baixa |
| `MV-FLAG` | Flags |

### Regras observadas

1. OP não pode já existir em `PCPA109I` (1 registro por OP no legado).
2. MP deve existir em `PCPA22I`.
3. Debita `MP-QUANTIDADE` e `MP-QTDE-ROLOS` no cadastro.
4. No sistema novo: **múltiplas MPs por OP** são permitidas (roteiro pode ter até 5 MPs).

### Calibração INDEXED

| Parâmetro | Valor |
|-----------|-------|
| Offset | 130 |
| Passo físico | 54 |
| Tamanho lógico | 54 |
| Registros no legado | 1 (dados incompletos — arquivo quase vazio) |

---

## 4. Modelo no PostgreSQL

| Tabela Prisma | Fonte | Descrição |
|---------------|-------|-----------|
| `MovimentoMateriaPrima` | PCPA76I + lançamentos manuais | Histórico de movimentos B/R |
| `OrdemProducaoBaixaMateriaPrima` | PCPA109I + API | Baixa de MP vinculada à OP |

Flag `OrdemProducao.baixadaMp` é atualizada ao registrar baixa via API.

---

## 5. Endpoints implementados

```text
GET  /ordens-producao/:id/baixas-mp  → MPs sugeridas + baixas + movimentos
POST /ordens-producao/:id/baixas-mp  → baixa MP (PC1109) + atualiza estoque
```

---

## 6. Migração

```bash
cd pcp-homol-migracao && npm run migrar:baixas-mp
```

| Arquivo | Resultado esperado |
|---------|------------------|
| PCPA76I | ~1.562 movimentos |
| PCPA109I | 0–1 (legado quase vazio) |

---

*Documento criado em 10/07/2026 — Fase 3b implementada no código.*
