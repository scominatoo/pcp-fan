# 16 — Engenharia reversa: Relatórios (Fase 5)

Documento gerado a partir dos fontes COBOL em `/Users/scominato/FANANDRI/FONTES/`.

**Programas analisados:**

| Programa | Menu | Função |
|----------|------|--------|
| **PC1078** | Produção | Relatório de OP **em aberto** |
| **PC1071** | Produção | Relatório de OP **baixadas** |
| **PC1135** | Produção | Consulta produção **por setor** (seção) |
| **PC1059** | Compras | Relatório MP com estoque **mínimo/máximo** |
| **PC1067** | Produção | Programação por setor / sintético mensal |

---

## 1. OP em aberto — PC1078

### Regra legado

- Lê `PCPA28I` (cabeçalho OP).
- Filtra registros com `OP-BAIXADA ≠ 'S'`.
- Permite filtro por intervalo de datas de abertura e intervalo de código OP.

### Implementação web

| Item | Valor |
|------|-------|
| Endpoint | `GET /api/relatorios/op-abertas` |
| Filtros | `dataInicio`, `dataFim`, `codigoOpInicio`, `codigoOpFim`, paginação |
| Tabela | `OrdemProducao` com `baixada = false` |

---

## 2. OP baixadas — PC1071

### Regra legado

- Lê `PCPA28I` com `OP-BAIXADA = 'S'`.
- Cruza com `PCPA71I` (baixa consolidada) para peças produzidas, MP consumida, data/hora.

### Implementação web

| Item | Valor |
|------|-------|
| Endpoint | `GET /api/relatorios/op-baixadas` |
| Join | `OrdemProducao` + `OrdemProducaoBaixaConsolidada` |
| Totais | quantidade de OPs e soma de `pecasProduzidas` |

---

## 3. Produção por setor — PC1135

### Regra legado

- Percorre baixas de operação (`PCPA132I`).
- Para cada baixa, identifica a **seção** da operação no roteiro (`PCPA70XI` / `PROC-OP-SECAO`).
- Acumula quantidade produzida (`BAIXA-OP-QTDE-SAIDA`) por seção.

### Implementação web

| Item | Valor |
|------|-------|
| Endpoint | `GET /api/relatorios/producao-setor` |
| Fonte | `OrdemProducaoBaixaOperacao` |
| Seção | `ProcessoOperacao.secaoCodigo` via produto da OP |
| Filtros | período (`dataFim` da baixa), `secaoCodigo` opcional |

---

## 4. Estoque MP crítico — PC1059

### Regra legado

- Lê cadastro de MP (`PCPA22I`).
- Lista itens com saldo **abaixo** de `MP-ESTOQUE-MIN` ou **acima** de `MP-ESTOQUE-MAX`.

### Implementação web

| Item | Valor |
|------|-------|
| Endpoint | `GET /api/relatorios/mp-estoque-critico` |
| Tabela | `MateriaPrima` |
| Filtro `tipo` | `minimo`, `maximo` ou `ambos` |

---

## 5. Programação sintética — PC1067 / PC1098

### Regra legado

- Agrega registros de `PCPA66I` por mês.
- Soma `PROGRAMA-QTDE`, `PROGRAMA-QTDE-ENTREGUE`, `PROGRAMA-QTDE-APRODUZIR`.

### Implementação web

| Item | Valor |
|------|-------|
| Endpoint | `GET /api/relatorios/programacao-sintetico` |
| Tabela | `ProgramacaoEntrega` |
| Agrupamento | ano-mês de `dataProgramacao` |

---

## 6. Frontend

| Rota | Tela |
|------|------|
| `/relatorios` | Hub com links para cada relatório |
| `/relatorios/op-abertas` | Filtros + tabela paginada |
| `/relatorios/op-baixadas` | Idem + colunas de baixa |
| `/relatorios/producao-setor` | Tabela por seção |
| `/relatorios/mp-estoque-critico` | Tabela MP crítica |
| `/relatorios/programacao-sintetico` | Tabela mensal |

Botão **Imprimir** chama `window.print()` para homologação com saída em papel equivalente ao COBOL.

---

## 7. Critérios de homologação (F5.6)

1. Contagem de OP abertas no relatório ≈ contagem `baixada=false` no banco.
2. Amostra de 10 OP baixadas: peças produzidas batem com `PCPA71I`.
3. Produção por setor: soma total ≈ soma de `qtdeSaida` nas baixas de operação (com seção mapeada).
4. MP crítica: conferir 10 itens com saldo vs. mín/máx cadastrado.
5. Programação sintética: totais por mês batem com consulta manual em `ProgramacaoEntrega`.

---

## Referências

- Plano: `07-plano-homologacao.md` — Fase 5
- Baixas: `13-engenharia-reversa-baixas.md`
- Programação: `15-engenharia-reversa-programacao.md`
