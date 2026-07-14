-- Pacote D: pedidos/compras, NRMP e saldo planejamento

CREATE TABLE IF NOT EXISTS "SaldoPlanejamento" (
    "id" SERIAL NOT NULL,
    "ano" INTEGER NOT NULL,
    "mes" INTEGER NOT NULL,
    "grupoCodigo" INTEGER NOT NULL,
    "classificacaoCodigo" INTEGER NOT NULL,
    "itemCodigo" INTEGER NOT NULL,
    "saldo" DECIMAL(14,0) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SaldoPlanejamento_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "SaldoPlanejamento_ano_mes_grupoCodigo_classificacaoCodigo_itemCodigo_key"
  ON "SaldoPlanejamento"("ano", "mes", "grupoCodigo", "classificacaoCodigo", "itemCodigo");
CREATE INDEX IF NOT EXISTS "SaldoPlanejamento_ano_mes_idx" ON "SaldoPlanejamento"("ano", "mes");

CREATE TABLE IF NOT EXISTS "PedidoCompra" (
    "id" SERIAL NOT NULL,
    "codigo" INTEGER NOT NULL,
    "pedidoFornecedor" INTEGER,
    "codFornecedor" INTEGER,
    "nomeFornecedor" VARCHAR(15),
    "flag" VARCHAR(1),
    "cancela" VARCHAR(3),
    "liberacao" VARCHAR(3),
    "localEntrega" VARCHAR(25),
    "dataPedido" TIMESTAMP(3),
    "dataLiberacao" TIMESTAMP(3),
    "dataRequisicao" TIMESTAMP(3),
    "dataEntrega" TIMESTAMP(3),
    "clienteCodigo" INTEGER,
    "depto" VARCHAR(10),
    "setor" VARCHAR(10),
    "condEntrega" VARCHAR(10),
    "ordemProducaoCodigo" INTEGER,
    "itens" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PedidoCompra_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "PedidoCompra_codigo_key" ON "PedidoCompra"("codigo");
CREATE INDEX IF NOT EXISTS "PedidoCompra_ordemProducaoCodigo_idx" ON "PedidoCompra"("ordemProducaoCodigo");
CREATE INDEX IF NOT EXISTS "PedidoCompra_dataPedido_idx" ON "PedidoCompra"("dataPedido");
CREATE INDEX IF NOT EXISTS "PedidoCompra_codFornecedor_idx" ON "PedidoCompra"("codFornecedor");

CREATE TABLE IF NOT EXISTS "PedidoMpAberto" (
    "id" SERIAL NOT NULL,
    "classeLetra" VARCHAR(1) NOT NULL,
    "classeNumero" INTEGER NOT NULL,
    "itemCodigo" INTEGER NOT NULL,
    "pedidoCodigo" INTEGER NOT NULL,
    "indice" INTEGER NOT NULL,
    "quantidade" DECIMAL(10,3) NOT NULL,
    "flag" VARCHAR(1),
    "ordemProducaoCodigo" INTEGER,
    "materiaPrimaId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PedidoMpAberto_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "PedidoMpAberto_classeLetra_classeNumero_itemCodigo_pedidoCodigo_indice_key"
  ON "PedidoMpAberto"("classeLetra", "classeNumero", "itemCodigo", "pedidoCodigo", "indice");
CREATE INDEX IF NOT EXISTS "PedidoMpAberto_pedidoCodigo_idx" ON "PedidoMpAberto"("pedidoCodigo");
CREATE INDEX IF NOT EXISTS "PedidoMpAberto_flag_idx" ON "PedidoMpAberto"("flag");
CREATE INDEX IF NOT EXISTS "PedidoMpAberto_ordemProducaoCodigo_idx" ON "PedidoMpAberto"("ordemProducaoCodigo");

CREATE TABLE IF NOT EXISTS "Nrmp" (
    "id" SERIAL NOT NULL,
    "letra" VARCHAR(2) NOT NULL,
    "numero" INTEGER NOT NULL,
    "letra2" VARCHAR(2) NOT NULL DEFAULT '',
    "classeLetra" VARCHAR(1),
    "classeNumero" INTEGER,
    "itemCodigo" INTEGER,
    "dataEntrada" TIMESTAMP(3),
    "fornecedorCodigo" INTEGER,
    "nota" INTEGER,
    "serie" VARCHAR(2),
    "corrida" VARCHAR(10),
    "quantidade" DECIMAL(10,3),
    "valorUnitario" DECIMAL(12,3),
    "produtoCodigo" VARCHAR(10),
    "ofCodigo" VARCHAR(15),
    "materiaPrimaId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Nrmp_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "Nrmp_letra_numero_letra2_key" ON "Nrmp"("letra", "numero", "letra2");
CREATE INDEX IF NOT EXISTS "Nrmp_dataEntrada_idx" ON "Nrmp"("dataEntrada");
CREATE INDEX IF NOT EXISTS "Nrmp_classeLetra_classeNumero_itemCodigo_idx"
  ON "Nrmp"("classeLetra", "classeNumero", "itemCodigo");

CREATE TABLE IF NOT EXISTS "NrmpConsulta" (
    "id" SERIAL NOT NULL,
    "letra" VARCHAR(2) NOT NULL,
    "numero" INTEGER NOT NULL,
    "letra2" VARCHAR(2) NOT NULL DEFAULT '',
    "nota" INTEGER,
    "tipo" VARCHAR(1),
    "data" TIMESTAMP(3),
    "pedidoCodigo" INTEGER,
    "quantidade" DECIMAL(10,3),
    "tipoNota" VARCHAR(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "NrmpConsulta_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "NrmpConsulta_letra_numero_letra2_key" ON "NrmpConsulta"("letra", "numero", "letra2");
