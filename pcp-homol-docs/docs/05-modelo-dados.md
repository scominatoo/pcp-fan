# 05 — Modelo de dados

Mapeamento entre arquivos legados COBOL e tabelas PostgreSQL.

**Implementação:** `backend/prisma/schema.prisma`  
**Origem dos layouts:** blocos `FD` em `/Users/scominato/FANANDRI/FONTES/*.COB`

---

## Formato dos arquivos legados

Os `.DAT` usam **organização INDEXED** do Micro Focus COBOL (par com `.IDX`).

| Característica | Implicação |
|----------------|------------|
| Registro lógico (`FD`) | Tamanho definido no COBOL |
| Registro físico no `.DAT` | Pode ter bytes extras de controle |
| Encoding | Latin-1 (ISO-8859-1) na prática |

### Calibração conhecida (INDEXED — offset 130)

| Arquivo | Lógico (FD) | Passo físico | Registros |
|---------|-------------|--------------|-----------|
| `PCPA19I.DAT` | 101 bytes | 104 | 256 |
| `PCPA20I.DAT` | 100 bytes | 104 | 35 |
| `PCPA18I.DAT` | 287 bytes | 292 | 1.834 |
| `PCPA22I.DAT` | 391 bytes | 396 | 3.298 |
| `PCPA28I.DAT` | 62 bytes | **64** (sequencial) | 72.005 |

Comandos de validação:

```bash
cd tools/migracao
npm run validar:indexed -- PCPA18I
npm run validar:indexed -- PCPA22I
npm run validar:arquivo -- PCPA28I.DAT 64
```

**Exportação alternativa** (já usada na FANANDRI — `POWER.BAT`):

```bat
rebuild pcpa22i.dat, arqprima.txt /t:lii
```

---

## Mapa arquivo → tabela

| Arquivo legado | Programa | Tabela Prisma | Status schema |
|----------------|----------|---------------|---------------|
| `PCPA19I.DAT` | PC1019 | `ProdutoGrupo` | ✅ |
| `PCPA20I.DAT` | PC1020 | `ProdutoClassificacao` | ✅ |
| `PCPA18I.DAT` | PC1018 | `Produto` | ✅ |
| `PCPA22I.DAT` | PC1022 | `MateriaPrima` | ✅ |
| `PCPA22II.DAT` | PC1022 | complemento MP | ⏳ |
| `PCPA22B.DAT` | PC1022 | desenho MP | ⏳ |
| `PCPA64I.DAT` | PC1064 | `Equipamento` | ✅ |
| `PCPA69I.DAT` | PC1069 | `Secao` | ✅ |
| `PCPA106I.DAT` | PC1106 | `DesenhoCliente` | ✅ |
| `PCPA70I.DAT` | PC1070 | processo produtivo | ⏳ |
| `PCPA70C.DAT` | PC1070 | processo complemento | ⏳ |
| `PCPA70XI.DAT` | PC1070 | roteiro operações | ⏳ |
| `PCPA129I.DAT` | PC1128 | ferramentas | ⏳ |
| `PCPA28I.DAT` | PC1028 | `OrdemProducao` | ✅ |
| `PCPA28II.DAT` | PC1028 | cliente na OP | ⏳ |
| `PCPA28E.DAT` | PC1028 | `OrdemProducaoOperacao` | ✅ |
| `PCPA71I.DAT` | PC1028 | `OrdemProducaoBaixaConsolidada` | ✅ |
| `PCPA132I.DAT` | PC1132 | `OrdemProducaoBaixaOperacao` | ✅ |
| `PCPA66I.DAT` | PC1066 | `ProgramacaoEntrega` | ✅ |
| `PCPA68I.DAT` | PC1097 | saldo planejamento | ⏳ |
| `PCPA76I.DAT` | PC1076 | `MovimentoMateriaPrima` | ✅ |
| `PCPA109I.DAT` | PC1109 | `OrdemProducaoBaixaMateriaPrima` | ✅ |
| `PCPA73I.DAT` | PC1073 | NRMP | ⏳ |
| `PCPA73II.DAT` | PC1073 | consulta NRMP | ⏳ |
| `PCPA41I.DAT` | PC1034 | pedidos/requisições | ⏳ |
| `PCPA41II.DAT` | PC1034 | pedidos MP abertos | ⏳ |
| `PCPA04I.DAT` | PC1004 | clientes (referência) | ⏳ |
| — | — | `MigracaoLog` | ✅ (controle interno) |

---

## Entidade: Ordem de Produção (`PCPA28I`)

| Campo COBOL | Tipo COBOL | Campo Prisma | Observação |
|-------------|------------|--------------|------------|
| `OP-CODIGO` | 9(08) | `codigo` | Chave única |
| `OP-PRODUTO` | X(15) | `produtoCodigo` | Código legado texto |
| `OP-QUANTIDADE` | 9(07) | `quantidade` | |
| `OP-ANO/MES/DIA` | 9(08) | `dataAbertura` | Converter para Date |
| `OP-BAIXADA` | X(01) | `baixada` | S = true |
| `OP-BAIXADA-MP` | X(01) | `baixadaMp` | |
| `OP-BAIXADA-PRODUTO` | X(01) | `baixadaProduto` | |
| `OP-TIPO` | X(03) | `tipo` | PRO, PIL, TRY, PRD |

Complemento em `PCPA28II.DAT`: `OP-CLIENTE` (40 chars).

Operações em `PCPA28E.DAT`: equipamento e ferramenta por operação da OP.

Baixa consolidada em `PCPA71I.DAT` (PC1028): peças, MP, rolos, tempos × 25 operações.

Baixa por operação em `PCPA132I.DAT` (PC1132): tempos, equipamento, quantidades por operação.

---

## Entidade: Produto (`PCPA18I`)

Código composto: **Grupo (3) + Classificação (2) + Item (5)**.

| Campo COBOL | Campo Prisma |
|-------------|--------------|
| `CI-DESCRICAO` | `descricao` |
| `CI-UNIDADE` | `unidade` |
| `CI-QUANTIDADE` | `quantidadeEstoque` |
| `CI-ESTOQUE-MIN/MAX` | `estoqueMin` / `estoqueMax` |
| `CI-DESENHO-SPARTA` | `desenhoSparta` |
| `CI-DESENHO-CLIENTE` | `desenhoCliente` |
| `CI-PLANEJAMENTO` | `planejamento` |

---

## Entidade: Matéria-prima (`PCPA22I`)

Código composto: **Classe letra (1) + Classe número (2) + Item (5)**.  
Exemplo legado: `J0100001` = classe J, item 100001.

| Campo COBOL | Campo Prisma |
|-------------|--------------|
| `MP-DESCRICAO` | `descricao` |
| `MP-UNIDADE` | `unidade` |
| `MP-ESPESSURA` | `espessura` |
| `MP-COMPRIMENTO` | `comprimento` |
| `MP-QUALIDADE` | `qualidade` |
| `MP-QUANTIDADE` | `quantidade` (saldo) |
| `MP-ESTOQUE-MIN/MAX` | `estoqueMin` / `estoqueMax` |

Complementos: `PCPA22II.DAT` (descrições longas, preço), `PCPA22B.DAT` (desenho cliente).

---

## Entidade: Programação (`PCPA66I`)

| Campo COBOL | Campo Prisma |
|-------------|--------------|
| `PROGRAMA-DATA` | `dataProgramacao` |
| `PROGRAMA-GRUPO/CLASSIF/ITEM` | `grupoCodigo`, `classificacaoCodigo`, `itemCodigo` |
| `PROGRAMA-QTDE` | `quantidade` |
| `PROGRAMA-QTDE-ENTREGUE` | `qtdeEntregue` |
| `PROGRAMA-QTDE-APRODUZIR` | `qtdeAProduzir` |
| `PROGRAMA-PEDIDO` | `pedidoRef` |
| `PROGRAMA-DES-CLI` | `desenhoCliente` |

---

## Tabela de controle: `MigracaoLog`

Registra cada execução de script de migração:

- Arquivo origem
- Registros lidos / OK / com erro
- Data/hora

Útil para auditoria e para comparar com o legado na homologação.
