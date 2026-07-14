# 10 — Referência do sistema legado

Resumo técnico do que foi analisado em `/Users/scominato/FANANDRI` — para consulta durante o desenvolvimento.

---

## Identificação

| Item | Valor |
|------|-------|
| Empresa | Indústria Metalúrgica FANANDRI Ltda. |
| Linguagem | COBOL (Micro Focus COBOL 4.5) |
| SO original | DOS / Windows |
| Desenvolvedora | InfoExpress Informática Ltda. |
| Autora principal | Cleusa C. Silva (desde ~1995) |
| Pasta analisada | `/Users/scominato/FANANDRI` (~6,3 GB) |

---

## Volume do acervo

| Tipo | Quantidade aproximada |
|------|----------------------|
| Programas `.COB` | ~212 |
| Linhas de COBOL | ~252.000 |
| Executáveis `.EXE` | ~420 |
| Arquivos `.DAT` | ~1.459 |
| Índices `.IDX` | ~1.052 |

---

## Como o legado inicia

```
MENU.BAT  →  PCP.EXE  →  PCP.COB (senha)  →  PC1000.COB (menus)
```

Compilação histórica (`F.BAT`):

```
COBOL45\BINB\COBOL programa,,;
LINK programa+COBINTFN;
```

---

## Módulos do ERP legado (referência — maioria fora do escopo)

| Login sistema | Senha (PC1000) | Módulo |
|---------------|----------------|--------|
| PCP | 7721 | Acesso amplo — navega todos os menus |
| FLUXO | 2369 | Fluxo de caixa |
| FATURAMENTO | 3420 | Vendas e NF |
| FISCAL | 5712 | ICMS, IPI |
| COMPRAS | 1541 | Compras |
| PRODUCAO | 9934 | **PCP — menu principal produção** |
| PROGRAMACAO | 3853 | **PCP — programação** |
| ESTOQUE | 2664 | Estoque produtos |
| ALMOXARIFADO | 0997 | **PCP — MP** |

> No projeto novo, replicamos o **conteúdo** dos menus PRODUÇÃO, PROGRAMAÇÃO e ALMOXARIFADO (parte MP), não o login administrativo "PCP".

---

## Arquivos de dados maiores (referência)

| Arquivo | Tamanho aprox. | Conteúdo |
|---------|----------------|----------|
| `PCPA41I.DAT` | 160 MB | Pedidos/requisições compra |
| `PCPA28I.DAT` | 4,6 MB | Ordens de produção |
| `PCPA132I.DAT` | variável | Desenhos / produtos relacionados |
| `PCPA22I.DAT` | 1,3 MB | Matéria-prima |
| `PCPA129I.DAT` | 1,2 MB | Ferramentas |
| `PCPA73I.DAT` | 3,8 MB | NRMP |

---

## Utilitários legados úteis

| Arquivo | Função |
|---------|--------|
| `POWER.BAT` | `rebuild` — exporta `.DAT` para texto |
| `F.BAT` | Compilar programa COBOL |
| `FONTES/` | Código-fonte de todos os programas |

---

## Onde ler regras de negócio no legado

1. **Cabeçalho do `.COB`** — linha `Funcao :`
2. **Menu `PC1000.COB`** — opções e `CALL` para cada programa
3. **Bloco `FD`** — estrutura de dados
4. **`PROCEDURE DIVISION`** — validações e cálculos

**Programas mais críticos para o PCP:**

| Programa | Arquivo fonte |
|----------|---------------|
| Menu geral | `FONTES/PC1000.COB` |
| Cadastro OP | `FONTES/PC1028.COB` |
| Emissão OP | `FONTES/PC1041.COB` |
| Processo | `FONTES/PC1070.COB` |
| Cadastro MP | `FONTES/PC1022.COB` / `FONTES/POWPRIMA.COB` |
| Programação | `FONTES/PC1066.COB`, `FONTES/PC1133.COB` |
| Baixa MP | `FONTES/PC1076.COB` |

---

## Exportação de matéria-prima (exemplo POWER.BAT)

```bat
rebuild pcpa22i.dat, arqprima.txt /t:lii
rebuild pcpa22ii.dat, arqprim2.txt /t:lii
rebuild pcpa22b.dat, arqprim3.txt /t:lii
```

Útil para validar parsers quando o tamanho binário do `.DAT` não fecha.
