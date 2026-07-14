-- CreateTable
CREATE TABLE "OrdemProducaoBaixaConsolidada" (
    "id" SERIAL NOT NULL,
    "ordemProducaoId" INTEGER NOT NULL,
    "dataBaixa" TIMESTAMP(3),
    "horaBaixa" VARCHAR(5),
    "pecasProduzidas" INTEGER NOT NULL DEFAULT 0,
    "mpConsumida" INTEGER NOT NULL DEFAULT 0,
    "rolos" INTEGER NOT NULL DEFAULT 0,
    "temposOperacoes" JSONB,
    "turno1" INTEGER NOT NULL DEFAULT 0,
    "turno2" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrdemProducaoBaixaConsolidada_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrdemProducaoBaixaOperacao" (
    "id" SERIAL NOT NULL,
    "ordemProducaoId" INTEGER NOT NULL,
    "numeroOperacao" INTEGER NOT NULL,
    "dataLancamento" TIMESTAMP(3),
    "dataInicio" TIMESTAMP(3),
    "horaInicio" VARCHAR(8),
    "dataFim" TIMESTAMP(3),
    "horaFim" VARCHAR(8),
    "diasTotal" INTEGER,
    "tempoTotalHoras" INTEGER,
    "tempoTotalMinutos" INTEGER,
    "tempoTotalSegundos" INTEGER,
    "equipamentoGrupo" INTEGER,
    "equipamentoCodigo" INTEGER,
    "qtdeSaida" INTEGER NOT NULL DEFAULT 0,
    "pesoSaida" DECIMAL(8,2),
    "dataSaida" TIMESTAMP(3),
    "qtdeEntrada" INTEGER NOT NULL DEFAULT 0,
    "pesoEntrada" DECIMAL(8,2),
    "dataEntrada" TIMESTAMP(3),
    "diferQtde" INTEGER,
    "diferPeso" DECIMAL(8,2),
    "diferTempo" INTEGER,
    "atualizouEstoque" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrdemProducaoBaixaOperacao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OrdemProducaoBaixaConsolidada_ordemProducaoId_key" ON "OrdemProducaoBaixaConsolidada"("ordemProducaoId");

-- CreateIndex
CREATE INDEX "OrdemProducaoBaixaOperacao_ordemProducaoId_idx" ON "OrdemProducaoBaixaOperacao"("ordemProducaoId");

-- CreateIndex
CREATE UNIQUE INDEX "OrdemProducaoBaixaOperacao_ordemProducaoId_numeroOperacao_key" ON "OrdemProducaoBaixaOperacao"("ordemProducaoId", "numeroOperacao");

-- AddForeignKey
ALTER TABLE "OrdemProducaoBaixaConsolidada" ADD CONSTRAINT "OrdemProducaoBaixaConsolidada_ordemProducaoId_fkey" FOREIGN KEY ("ordemProducaoId") REFERENCES "OrdemProducao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrdemProducaoBaixaOperacao" ADD CONSTRAINT "OrdemProducaoBaixaOperacao_ordemProducaoId_fkey" FOREIGN KEY ("ordemProducaoId") REFERENCES "OrdemProducao"("id") ON DELETE CASCADE ON UPDATE CASCADE;
