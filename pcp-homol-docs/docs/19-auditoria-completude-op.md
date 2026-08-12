# 19 — Auditoria de completude dos dados de OP e plano de importação dos gaps

Verificação independente feita cruzando **todo** o inventário físico de
`/Users/scominato/FANANDRI` (8.202 arquivos, decodificados via `FONTES/*.COB`)
contra os scripts `pcp-homol-migracao/src/migrar-*.ts` e o
`pcp-homol-api/prisma/schema.prisma`, para responder: *falta algo relevante
a OP para importar?*

---

## 1. O que já está migrado e íntegro (confirmado nesta auditoria)

Todo o núcleo de OP já mapeado em [`05-modelo-dados.md`](./05-modelo-dados.md)
como ✅ foi conferido de novo, de forma independente:

- `PCPA28I/28II/28E` (OP + cliente + operações), baixas (`PCPA71I/132I`),
  baixa MP (`PCPA76I/109I`), processo/roteiro (`PCPA70I/70C/70XI`),
  cadastros (produto, MP, cliente, equipamento, seção, ferramenta),
  programação (`PCPA66I`) e compras/NRMP (Pacote D) — todos têm script
  `migrar:*` e model Prisma correspondentes, com contagens batendo.
- `PCPA70C` e `PCPA109I` estão ⚠️ "quase vazios" no PostgreSQL porque o
  **próprio arquivo legado** só tem 0–1 registro — não é falha de script.
- Existem **5 cópias físicas** de `PCPA28I.DAT`/`PCPA28E.DAT` (raiz,
  `backupfanandri`, `backup20230111`, `junho2017`, `BACKUP20251107`).
  Comparando tamanhos, a cópia na **raiz** (a que o `.env` `LEGACY_DATA_PATH`
  aponta) é a maior de todas em ambos os arquivos — já é o superset mais
  completo. Não existe uma cópia mais recente/maior "escondida" em outro
  backup com OPs que ficaram de fora da migração.

**Conclusão:** a documentação existente reflete corretamente o que foi
migrado. Os gaps abaixo são pontos que não estavam em nenhum documento —
nem como migrado, nem como excluído do escopo.

---

## 2. Gaps confirmados

Nenhum dos três é citado em `03-escopo-pcp.md`, `10-sistema-legado-referencia.md`
ou `12-engenharia-reversa-op.md`: não foram excluídos de propósito, são
pontos cegos.

### 2.1 `PCPA103I.DAT` (PRIMA-PECA) — relação matéria-prima × peça ✅ migrado (12/08/2026)

- **Programa de origem:** `PC1103.COB` ("Consulta de M.Prima X produtos").
- **Layout confirmado** (`FD PRIMA-PECA`, `VALUE OF FILE-ID IS "PCPA103I.DAT"`):

  ```
  01  REG-PRIMA-PECA.
      02 CHAVE-DOIS.
         03 CHAVE-PECA          PIC X(15).   " código do produto/peça
         03 CHAVE-UM.
            05 CHAVE-PRIMA.
               07 PP-CLASSE.
                  08 PP-CLASSE-L   PIC X(01).  " mesma estrutura de MP-CODIGO
                  08 PP-CLASSE-N   PIC 9(02).
               07 PP-ITEN          PIC 9(05).
  ```

- É literalmente uma **tabela de junção** peça↔matéria-prima (chave
  composta, sem campos extras). Arquivo tem 81.216 bytes — volume real de
  dados (não é um arquivo quase vazio).
- **Por que importa:** hoje a relação produto↔MP só existe implícita em
  `ProcessoProdutivo`/`materiasPrimasComplemento` (que no legado está
  quase vazio, ⚠️). `PRIMA-PECA` é provavelmente a fonte mais confiável
  dessa relação e pode preencher essa lacuna.
- **Prioridade sugerida:** média-alta — dado real, estrutura simples, baixo
  risco de ambiguidade.

### 2.2 `ABERTO.DAT` e `CONT_OP5.DAT` — últimas 5 OPs por produto ✅ investigado, NÃO migrar (12/08/2026)

- **Programa de origem:** não encontrado em nenhum dos 210 `.COB` de
  `FONTES/` (só existe o `.EXE` compilado). Sem `FD` disponível — layout
  reconstruído por engenharia reversa dos bytes brutos.
- **Layout decodificado por tentativa** (offset 128, sem `.COB` para
  confirmar nomes de campo):

  | Arquivo | Marcador | Passo físico | Registros | Campos |
  |---|---|---|---|---|
  | `ABERTO.DAT` | `@` (1 byte) | 60 | 1.320 | marcador(1) + `X(15)` código-produto + `9(08)` OCCURS 5 (códigos de OP) + trailer constante `7\x00\x00` (3 bytes) |
  | `CONT_OP5.DAT` | `@<` (2 bytes) | 64 | 1.947 | marcador(2) + `X(15)` código-produto + `9(08)` OCCURS 5 (códigos de OP) + trailer constante `23451\x00\x00` (7 bytes) |

  Os dois arquivos têm a **mesma estrutura lógica**: código de produto +
  até 5 códigos de OP. O trailer é um valor fixo idêntico em todos os
  registros amostrados — não parece ser dado de negócio (provável
  artefato do motor ISAM do Micro Focus).

- **Confirmação cruzada com o PostgreSQL (não é só suposição):** os
  códigos de OP dentro dos slots batem exatamente com
  `OrdemProducao.codigo`, e o campo `X(15)` bate exatamente com
  `OrdemProducao.produtoCodigo`. Testado com 4 produtos de `CONT_OP5.DAT`
  (`0767`, `11072782`, `N01525`, `111404`): em todos os casos, o
  **conjunto** dos 5 códigos de OP no arquivo é idêntico ao conjunto das
  5 OPs mais recentes desse produto no banco (`ORDER BY dataAbertura DESC
  LIMIT 5`) — só a ordem interna difere (o arquivo parece manter ordem de
  buffer circular de escrita, não ordenado por data). Exemplo:

  ```
  produtoCodigo '111404'
    arquivo CONT_OP5:        [78990, 78654, 78423, 78010, 79266]
    banco (data desc, top5): [79266, 78990, 78654, 78423, 78010]
  ```

  Mesmo conjunto de 5 códigos nos dois lados — confirma que é **cache
  derivado**, não dado original. Um registro de `CONT_OP5.DAT` também
  mostrou entradas corrompidas/de slot reaproveitado (`40000000`,
  `08000000` — fora da faixa real de `OP-CODIGO`), reforçando que é
  estrutura de índice interna do runtime, não fonte de verdade.

- **Decisão:** **não migrar.** Conteúdo 100% reconstruível a partir de
  `OrdemProducao` já migrado — `ORDER BY dataAbertura DESC LIMIT 5 WHERE
  produtoCodigo = X` reproduz o conjunto de `CONT_OP5`/`ABERTO`. Fechado
  sem necessidade de novo model Prisma nem script `migrar:*`.

### 2.3 `PCPA23I.DAT` (PEDIDO de venda do cliente)

- **Programa de origem:** `PC1023.COB` ("Programa de Manutenção de PEDIDOS
  DE VENDA C/DESCONTO", criado em 05/01/95).
- **Layout confirmado** (`FD PEDIDO`, `VALUE OF FILE-ID IS "PCPA23I.DAT"`) —
  campos relevantes:

  ```
  01  REG-PEDIDO.
      02 COD-PEDIDO.
         03 PD-COD-PEDIDO      PIC 9(07).
      02 PD-OP                 PIC 9(08).     " <-- link direto para OP-CODIGO
      02 PD-COD-CLIENTE        PIC 9(05).
      02 PD-TP-PEDIDO          PIC X(03).     " "pro"=pedido de produção, "rem"=remessa etc.
      02 PD-EMISSAO (ano/mes/dia)
      ... (total ~1000+ bytes/registro, inclui itens, frete, ICM etc.)
  ```

  O mesmo programa também define `ORDEM-P` (`COD-PEDIDO-OP`, arquivo de
  nome variável por OP) e referencia auxiliares `PCPA23II.DAT` ("guarda o
  número das OPs de cada pedido, qtde de caixas e número de pedido
  cliente") e `PCPA23X.DAT` (pedido × produto × quantidade baixada).

- **Por que importa:** ao contrário do que se imaginava antes de ler o
  fonte, **existe um link direto e explícito** `PD-OP` do pedido de venda
  para `OP-CODIGO`. Hoje `OrdemProducao` só guarda `clienteNome` como texto
  solto — não há como saber, a partir da OP, qual pedido de venda a
  originou. Esse campo resolveria isso.
- **Mas — achado importante:** `PCPA23I.DAT` tem só **5.808 bytes**
  (`PCPA23II.DAT`: 1.528 bytes, `PCPA23X.DAT`: 212 bytes) e a última
  modificação é de **1998–2000** — muito antes da faixa 2007–2019 dos
  arquivos de OP. Com um registro de +1.000 bytes, isso dá pouquíssimos
  pedidos gravados (provavelmente uma dezena). Ou seja, na prática o
  módulo de "Pedido de Venda" parece ter sido abandonado/pouco usado cedo
  na vida do sistema — mesmo padrão de `PCPA70C`/`PCPA109I` (arquivo
  estruturalmente pronto, mas quase vazio no legado real).
- **Prioridade sugerida:** baixa, apesar do link técnico existir — o
  retorno (poucas dezenas de OPs ganhariam um `pedidoId`) provavelmente
  não justifica o esforço, mas é uma decisão de negócio: vale confirmar
  com a Fanandri se algum desses poucos pedidos é referência viva.

---

## 3. Fora do escopo de importação automática (dados não estruturados)

Encontrados durante a auditoria, não entram no plano de scripts — só
citados para conhecimento:

| Fonte | O que é | Observação |
|---|---|---|
| `ROBSON/*.docx` (35 arquivos) | Fichas de processo escaneadas, uma por peça (ex.: `P110057.docx`) | É imagem dentro do `.docx` (~0 caracteres de texto real) — precisaria OCR manual para virar dado |
| ~2.199 planilhas Excel ("Almoxarifado…") | Exports periódicos manuais de estoque/requisição de material por OP | Podem ter reconciliações que não estão nos `.DAT` — útil só se houver suspeita de divergência pontual |
| 28 arquivos `.ARJ` (2009–2016) | Backups históricos completos, não descompactados | Só relevante se precisar de OP anterior a 2007 (pouco provável, já que a cópia viva na raiz já é o superset) |

---

## 4. Plano de importação (próxima etapa, após aprovação)

### 4.1 `PCPA103I` → nova tabela `MateriaPrimaPeca` ✅ concluído (12/08/2026)
1. ~~Calibrar leitura INDEXED~~ — feito: **offset 128, passo físico 28, lógico 23, `skipIndiceBytes=2`** (mesmo padrão de `PCPA70XI`). Registro tem 2 bytes de índice Micro Focus antes do `CHAVE-PECA`. 2.896 registros, resto 0.
2. ~~Criar `src/layouts/pcpa103i.ts`~~ — feito.
3. ~~Criar `src/migrar-prima-peca.ts` + script `migrar:prima-peca`~~ — feito. Reaproveita o resolvedor de produto (`porDesenhoCliente`/`porChave`) já usado em `migrar-processo.ts`, porque `CHAVE-PECA` é a mesma referência X(15) usada em `OP-PRODUTO`/`PROCESSO-PRODUTO` (geralmente desenho do cliente).
4. ~~Adicionar model Prisma `MateriaPrimaPeca`~~ — feito (migration `20260812143824_add_materia_prima_peca`). FK opcional para `Produto` (`produtoId`) e para `MateriaPrima` (`materiaPrimaId`), chave única `[produtoCodigo, classeLetra, classeNumero, itemCodigo]`.
5. Resultado: **2.892 gravados** de 2.896 lidos (4 ignorados — vazio/duplicado). **2.393 sem `produtoId`** resolvido (82,7%) — mesma taxa de não-resolução já observada em `ProcessoProdutivo` (1.978/2.457 = 80,5%), ou seja, é uma característica conhecida do dado legado (muitos desenhos de cliente referenciados no PRIMA-PECA não têm `Produto` cadastrado formalmente), não um bug do script. Só 5 sem `materiaPrimaId`.

### 4.2 `ABERTO.DAT` / `CONT_OP5.DAT` ✅ concluído (12/08/2026) — não migrar
Investigado e confirmado com cruzamento real contra o PostgreSQL (ver
seção 2.2 acima). Conteúdo é cache derivado de `OrdemProducao`, coberto
por `ORDER BY dataAbertura DESC LIMIT 5 WHERE produtoCodigo = X`. Fechado
sem migração.

### 4.3 `PCPA23I` (Pedido de venda) + auxiliares `PCPA23II`/`PCPA23X`
1. **Não migrar agora.** Registrar como decisão de negócio pendente:
   confirmar com a Fanandri se as poucas dezenas de pedidos gravados nesse
   arquivo (1998–2000) têm valor de referência hoje.
2. Se confirmado que sim: calibrar `PCPA23I.DAT` (registro grande, ~1.000+
   bytes, tabela de itens embutida em `PD-TAB-ITENS`), criar model `Pedido`
   com FK opcional em `OrdemProducao.pedidoId` (via `PD-OP`), e replicar o
   fluxo de layout/script/validação dos itens anteriores.

### 4.4 B8 — validação manual pendente (não é gap novo, mas fecha o ciclo)
Já registrado em [`08-proximos-passos.md`](./08-proximos-passos.md) como
⬜. Ação recomendada: rodar `validar:indexed`/`validar:arquivo` nos
arquivos-chave de OP e comparar 10 amostras com o sistema legado (tela ou
relatório COBOL), fechando essa pendência junto com os itens acima.

---

## 5. Resumo executivo

| Item | Status hoje | Ação recomendada |
|---|---|---|
| Núcleo de OP (header, operações, baixas, roteiro, cadastros) | ✅ migrado, contagens conferem | Nenhuma — só falta B8 (conferência manual) |
| `PRIMA-PECA` (`PCPA103I`) | ✅ migrado (12/08/2026) — 2.892 registros | Nenhuma |
| `ABERTO`/`CONT_OP5` | ✅ investigado — não migrar | Confirmado como cache derivado de `OrdemProducao` (12/08/2026) |
| `PEDIDO` de venda (`PCPA23I` + auxiliares) | ⬜ não migrado | Decisão de negócio — link técnico existe (`PD-OP`) mas dado quase vazio no legado |
| Fontes não estruturadas (ROBSON, Excel, ARJ) | Fora do escopo automático | Triagem manual só sob demanda |

---

## 6. Incidente 12/08/2026 — banco local zerado (resolvido)

Ao iniciar esta migração, o banco `pcp_homol` do container `pcp-homol-db`
estava **vazio** (0 linhas em todas as tabelas), embora a documentação
indicasse tudo migrado. Causa: o `docker-compose.yml` usava um nome de
volume sem `name:` fixo (`pcp_pgdata`); o Compose deriva o nome real do
volume a partir do nome do *projeto* (normalmente o nome da pasta). A
reorganização de pastas de 10/07/2026 (`11-repositorios-separados.md`)
mudou esse nome de projeto, e em algum momento (indícios apontam para
11/08/2026, quando o container atual foi recriado) isso resultou num
volume novo e vazio (`pcp-homol-api_pcp_pgdata`, 64 MB), órfão do volume
antigo com os dados reais (`pcp-homol_pcp_pgdata`, 260 MB).

**Recuperação:** restaurado o backup mais recente,
`backups/pcp_homol_full_20260721-1004.dump` (21/07/2026), via `pg_restore`
dentro do próprio container, seguido de `prisma migrate deploy` para
reaplicar as duas migrations criadas depois do dump
(`requisicao_material`, `add_materia_prima_peca`). Duas dessas alterações
de índice já existiam no dump com nome novo (drift de uma migração
anterior) — aplicadas manualmente via SQL e a migration marcada como
aplicada com `prisma migrate resolve --applied`. Contagens conferidas
depois da restauração: 1.834 produtos, 3.298 MPs, 72.002 OPs, 125.260
operações — batendo com os totais já documentados.

**Correção estrutural:** `pcp-homol-api/docker-compose.yml` agora fixa
`volumes.pcp_pgdata.name: pcp-homol-api_pcp_pgdata`, então o nome do
volume não depende mais do nome do projeto/pasta — mover ou renomear o
repositório não vai mais órfanar o volume.

**Lição:** depois de qualquer `docker compose down`/recriação de
container, rodar uma contagem rápida (`SELECT count(*) FROM "OrdemProducao"`)
antes de assumir que os dados migrados continuam lá.
