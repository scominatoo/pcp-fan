-- CreateTable
CREATE TABLE "OrdemProducaoBaixaMateriaPrima" (
    "id" SERIAL NOT NULL,
    "ordemProducaoId" INTEGER NOT NULL,
    "materiaPrimaId" INTEGER NOT NULL,
    "quantidade" DECIMAL(10,2) NOT NULL,
    "qtdeRolos" INTEGER NOT NULL DEFAULT 0,
    "dataBaixa" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrdemProducaoBaixaMateriaPrima_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MovimentoMateriaPrima" (
    "id" SERIAL NOT NULL,
    "loteLetra" VARCHAR(2) NOT NULL DEFAULT '',
    "loteNumero" INTEGER NOT NULL DEFAULT 0,
    "loteLetra2" VARCHAR(2) NOT NULL DEFAULT '',
    "indice" INTEGER NOT NULL DEFAULT 0,
    "tipo" VARCHAR(1) NOT NULL,
    "dataMovimento" TIMESTAMP(3),
    "nota" INTEGER,
    "materiaPrimaId" INTEGER,
    "classeLetra" VARCHAR(1) NOT NULL,
    "classeNumero" INTEGER NOT NULL,
    "itemCodigo" INTEGER NOT NULL,
    "qtdeRolos" INTEGER NOT NULL DEFAULT 0,
    "quantidade" DECIMAL(10,2) NOT NULL,
    "flag" VARCHAR(3),
    "ordemProducaoId" INTEGER,
    "origem" VARCHAR(16) NOT NULL DEFAULT 'PCPA76I',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MovimentoMateriaPrima_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OrdemProducaoBaixaMateriaPrima_ordemProducaoId_idx" ON "OrdemProducaoBaixaMateriaPrima"("ordemProducaoId");

-- CreateIndex
CREATE INDEX "OrdemProducaoBaixaMateriaPrima_materiaPrimaId_idx" ON "OrdemProducaoBaixaMateriaPrima"("materiaPrimaId");

-- CreateIndex
CREATE INDEX "MovimentoMateriaPrima_materiaPrimaId_idx" ON "MovimentoMateriaPrima"("materiaPrimaId");

-- CreateIndex
CREATE INDEX "MovimentoMateriaPrima_ordemProducaoId_idx" ON "MovimentoMateriaPrima"("ordemProducaoId");

-- CreateIndex
CREATE INDEX "MovimentoMateriaPrima_tipo_idx" ON "MovimentoMateriaPrima"("tipo");

-- CreateIndex
CREATE UNIQUE INDEX "MovimentoMateriaPrima_loteLetra_loteNumero_loteLetra2_indic_key" ON "MovimentoMateriaPrima"("loteLetra", "loteNumero", "loteLetra2", "indice", "tipo", "dataMovimento", "nota", "classeLetra", "classeNumero", "itemCodigo");

-- AddForeignKey
ALTER TABLE "OrdemProducaoBaixaMateriaPrima" ADD CONSTRAINT "OrdemProducaoBaixaMateriaPrima_ordemProducaoId_fkey" FOREIGN KEY ("ordemProducaoId") REFERENCES "OrdemProducao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrdemProducaoBaixaMateriaPrima" ADD CONSTRAINT "OrdemProducaoBaixaMateriaPrima_materiaPrimaId_fkey" FOREIGN KEY ("materiaPrimaId") REFERENCES "MateriaPrima"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimentoMateriaPrima" ADD CONSTRAINT "MovimentoMateriaPrima_materiaPrimaId_fkey" FOREIGN KEY ("materiaPrimaId") REFERENCES "MateriaPrima"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovimentoMateriaPrima" ADD CONSTRAINT "MovimentoMateriaPrima_ordemProducaoId_fkey" FOREIGN KEY ("ordemProducaoId") REFERENCES "OrdemProducao"("id") ON DELETE SET NULL ON UPDATE CASCADE;
