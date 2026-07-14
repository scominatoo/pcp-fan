# 15 — Engenharia reversa: Programação de entregas (Fase 4)

Documento gerado a partir dos fontes COBOL em `/Users/scominato/FANANDRI/FONTES/`.

**Programas analisados:**

| Programa | Menu | Função |
|----------|------|--------|
| **PC1066** | Produção 056 | Entrada, consulta, alteração e **entrega** de programação |
| **PC1133** | Produção 113 | Geração de programação mensal/diária |
| **PC1097** | — | Consulta saldo / planejamento (usa `PCPA66I`) |

---

## 1. Arquivo principal: `PCPA66I.DAT`

Usado por PC1066 e PC1133. Cada registro é uma linha de programação ou entrega.

### Chave do registro (`PROGRAMA-CHAVE`)

| Campo | Tamanho | Significado |
|-------|---------|-------------|
| Data (ano/mês/dia) | 8 | Data programada |
| Grupo / Classif. / Item | 10 | Produto (código interno) |
| Plano | 2 | Código do plano (ex.: `4E`, `G1`, `BE`) |
| Flag | 1 | Tipo do registro (ver abaixo) |

### Flags observadas (PC1066)

| Flag | Significado |
|------|-------------|
| `P` | Programação (planejamento) |
| `R` | Reprogramação |
| `A` | Ajuste |
| `E`–`O` | Entregas (até 11 no mesmo dia/produto) |

### Demais campos (105 bytes lógicos)

| Campo COBOL | Campo Prisma |
|-------------|--------------|
| `PROGRAMA-QTDE` | `quantidade` |
| `PROGRAMA-PEDIDO` | `pedidoRef` |
| `PROGRAMA-PEDIDO2` | `pedidoRef2` |
| `PROGRAMA-DES-CLI` | `desenhoCliente` |
| `PROGRAMA-QTDE-ENTREGUE` | `qtdeEntregue` |
| `PROGRAMA-QTDE-APRODUZIR` | `qtdeAProduzir` |
| `PROGRAMA-FLAG-DEVOLVIDO` | `devolvido` |

> Quando grupo/item = zero, o produto é identificado pelo **desenho do cliente**.

### Calibração INDEXED (10/07/2026)

| Parâmetro | Valor |
|-----------|-------|
| Offset | 130 |
| Passo físico | **108** |
| Tamanho lógico | 105 |
| Registros válidos | ~1.383 |

---

## 2. PC1066 — Fluxos principais

| Opção | Rotina | Ação |
|-------|--------|------|
| Entrada | Inclusão | Nova programação (`flag` = `P`) |
| Entrega | `INCLUI-ENTREGA` | Baixa parcial/total (`qtdeEntregue`, `qtdeAProduzir`) |
| Consulta | Listagem por período/produto | — |
| Exclusão | Só se **não houve entrega** | Regra replicada na API |

---

## 3. PCPA68I — Saldo planejamento (fase futura)

Arquivo `PCPA68I.DAT` (`REG-PAI-FAM` em PC1066) guarda saldo mensal pai/filho. Arquivo legado pequeno (~736 bytes). Na Fase 4 o **saldo é calculado** a partir de `PCPA66I` via endpoint `/programacao/resumo`.

---

## 4. Endpoints implementados

```text
GET    /programacao              → listagem paginada (filtros data, busca)
GET    /programacao/resumo        → totais programado/entregue/a produzir
GET    /programacao/atrasos       → itens vencidos com qtdeAProduzir > 0
GET    /programacao/:id           → detalhe
POST   /programacao              → nova programação
PATCH  /programacao/:id          → alterar (sem entregas)
POST   /programacao/:id/entrega  → registrar entrega
DELETE /programacao/:id          → excluir (sem entregas)
```

---

## 5. Migração

```bash
cd pcp-homol-migracao && npm run migrar:programacao
```

---

*Documento criado em 10/07/2026 — Fase 4 implementada no código.*
