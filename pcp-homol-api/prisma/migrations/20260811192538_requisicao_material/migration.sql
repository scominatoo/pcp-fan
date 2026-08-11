-- CreateTable
CREATE TABLE "RequisicaoMaterial" (
    "id" SERIAL NOT NULL,
    "numero" INTEGER NOT NULL,
    "ano" INTEGER NOT NULL,
    "itemOrdem" INTEGER NOT NULL,
    "ordemProducaoId" INTEGER NOT NULL,
    "classeLetra" VARCHAR(1) NOT NULL,
    "classeNumero" INTEGER NOT NULL,
    "itemCodigo" INTEGER NOT NULL,
    "materiaPrimaId" INTEGER,
    "quantidade" DECIMAL(11,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RequisicaoMaterial_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RequisicaoMaterial_numero_key" ON "RequisicaoMaterial"("numero");

-- CreateIndex
CREATE UNIQUE INDEX "RequisicaoMaterial_ordemProducaoId_classeLetra_classeNumero_key" ON "RequisicaoMaterial"("ordemProducaoId", "classeLetra", "classeNumero", "itemCodigo");

-- AddForeignKey
ALTER TABLE "RequisicaoMaterial" ADD CONSTRAINT "RequisicaoMaterial_ordemProducaoId_fkey" FOREIGN KEY ("ordemProducaoId") REFERENCES "OrdemProducao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequisicaoMaterial" ADD CONSTRAINT "RequisicaoMaterial_materiaPrimaId_fkey" FOREIGN KEY ("materiaPrimaId") REFERENCES "MateriaPrima"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "PedidoMpAberto_classeLetra_classeNumero_itemCodigo_pedidoCodigo" RENAME TO "PedidoMpAberto_classeLetra_classeNumero_itemCodigo_pedidoCo_key";

-- RenameIndex
ALTER INDEX "ProgramacaoEntrega_dataProgramacao_grupoCodigo_classificacaoCod" RENAME TO "ProgramacaoEntrega_dataProgramacao_grupoCodigo_classificaca_key";

-- RenameIndex
ALTER INDEX "SaldoPlanejamento_ano_mes_grupoCodigo_classificacaoCodigo_itemC" RENAME TO "SaldoPlanejamento_ano_mes_grupoCodigo_classificacaoCodigo_i_key";
