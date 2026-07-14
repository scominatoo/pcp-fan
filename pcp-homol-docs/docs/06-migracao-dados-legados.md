# 06 — Migração dos dados legados

Como trazer os dados do COBOL (`.DAT`/`.IDX`) para o PostgreSQL.

---

## Princípios

1. **Fonte:** `/Users/scominato/FANANDRI` — pasta em uso pelo sistema que roda hoje
2. **Não traduzir COBOL** — ler dados e reimplementar regras em TypeScript
3. **Validar sempre** — comparar totais com o sistema legado antes de homologar
4. **Registrar tudo** — tabela `MigracaoLog` + logs no console

---

## Ferramentas no projeto

```
tools/migracao/
├── src/
│   ├── parse-dat.ts           # Leitura binária registro fixo
│   ├── layouts/               # Um arquivo por .DAT
│   │   ├── pcpa18i.ts         # Produtos
│   │   ├── pcpa22i.ts         # Matéria-prima
│   │   └── pcpa28i.ts         # Ordens de produção
│   ├── migrar-cadastros.ts    # Script: produtos + MP
│   └── validar-arquivo.ts     # Testa tamanho do registro
```

---

## Passo a passo de uma migração

### 1. Validar tamanho do registro

```bash
cd tools/migracao
npm install
npm run validar:arquivo -- PCPA28I.DAT 64
```

Interpretação:

- `resto = 0` → tamanho correto
- `resto ≠ 0` → testar outros tamanhos ou usar `rebuild` para exportar texto

### 2. Ajustar layout (se necessário)

Editar `tools/migracao/src/layouts/pcpaXX.ts` com campos e tamanhos do `FD` COBOL correspondente em `FANANDRI/FONTES/`.

### 3. Executar migração

```bash
# Banco deve estar rodando e migrations aplicadas
npx prisma generate
npm run migrar:cadastros
```

### 4. Conferir no legado

Enquanto o COBOL ainda roda, anotar no sistema antigo:

- Total de produtos cadastrados
- Total de MPs
- Total de OPs abertas
- Amostra de 10 registros campo a campo

### 5. Conferir no PostgreSQL

```bash
cd backend
npx prisma studio
```

Ou SQL:

```sql
SELECT COUNT(*) FROM "Produto";
SELECT COUNT(*) FROM "MateriaPrima";
SELECT COUNT(*) FROM "MigracaoLog";
```

---

## Ordem de carga recomendada

| Ordem | Arquivos | Motivo | Status |
|-------|----------|--------|--------|
| 1 | `PCPA19I`, `PCPA20I` | Grupos e classificações antes dos produtos | ✅ |
| 2 | `PCPA18I` | Produtos | ✅ |
| 3 | `PCPA22I`, `PCPA22II`, `PCPA22B` | Matéria-prima + complementos | ✅ |
| 4 | `PCPA64I`, `PCPA69I`, `PCPA106I` | Equipamentos, seções, desenhos (Pacote A) | ✅ |
| 5 | `PCPA70I`, `PCPA70C`, `PCPA70XI` | Processo produtivo | ✅ |
| 6 | `PCPA129I` | Ferramentas (Pacote B) | ✅ |
| 7 | `PCPA28I`, `PCPA28II`, `PCPA28E` | Ordens de produção | ✅ |
| 8 | `PCPA66I`, `PCPA68I` | Programação + saldo | ✅ |
| 9 | `PCPA76I`, `PCPA73I`/`73II`, `PCPA41I`/`41II` | Movimentos, NRMP, compras (Pacote D) | ✅ |
| — | `PCPA04I` | Clientes (Pacote C) | ✅ |

---

## Problema conhecido: arquivos INDEXED

Os `.DAT` não são CSV nem SQL dump. São arquivos **indexados** do Micro Focus.

**Sintomas:**

- Tamanho do arquivo não divide pelo tamanho do `FD`
- Caracteres especiais (encoding Latin-1)

**Solução adotada (calibrada em 09/07/2026):**

Cada arquivo indexado tem um **passo físico** (distância entre registros no `.DAT`) maior que o tamanho lógico do `FD` COBOL, e um **offset inicial** (cabeçalho de ~130 bytes).

| Arquivo | Offset | Passo físico | Lógico (FD) |
|---------|--------|--------------|-------------|
| `PCPA19I.DAT` | 130 | 104 | 101 |
| `PCPA20I.DAT` | 130 | 104 | 100 |
| `PCPA18I.DAT` | 130 | 292 | 287 |
| `PCPA22I.DAT` | 130 | 396 | 391 |
| `PCPA28I.DAT` | 130 | 64 | 62 |
| `PCPA28II.DAT` | 130 | 172 | 168 |
| `PCPA28E.DAT` | 130 | 76 | 74 |
| `PCPA70I.DAT` | 130 | 150 | 146 |
| `PCPA70XI.DAT` | 128 | 672 | 668 (`skipIndiceBytes=2`) |

Código: `pcp-homol-migracao/src/ler-indexed-dat.ts`  
Validar: `npm run validar:indexed -- PCPA18I` (também `PCPA22I`, `PCPA28E`)

**Alternativas (se calibração falhar):**

| Solução | Quando usar |
|---------|-------------|
| Utilitário `rebuild` do legado (`POWER.BAT`) | Exportar para texto e importar |
| Programa COBOL one-shot | Último recurso — ler e gravar CSV |

---

## Scripts de migração

| Script npm | Arquivos | Status |
|------------|----------|--------|
| `migrar:cadastros` | PCPA19I, PCPA20I, PCPA18I, PCPA22I | ✅ |
| `migrar:apoio-op` | PCPA106I, PCPA69I, PCPA64I (Pacote A) | ✅ |
| `migrar:processo` | PCPA70I, PCPA70XI | ✅ |
| `migrar:pacote-b` | PCPA70C, PCPA129I | ✅ |
| `migrar:ops` | PCPA28I, PCPA28II, PCPA28E | ✅ (125.244 operações) |
| `migrar:baixas` | PCPA71I, PCPA132I | ✅ |
| `migrar:baixas-mp` | PCPA76I, PCPA109I | ✅ |
| `migrar:programacao` | PCPA66I | ✅ |
| `migrar:pacote-c` | PCPA22II, PCPA22B, PCPA04I | ✅ |
| `migrar:pacote-d` | PCPA41I, PCPA41II, PCPA73I, PCPA73II, PCPA68I | ✅ |

---

## Critério de sucesso da migração

Para cada arquivo:

```
registros_lidos ≈ registros no legado (consulta ou contagem)
registros_ok / registros_lidos > 99%
amostra_manual_10_itens = 100% conferida
```

Só então liberar a fase de homologação correspondente.
