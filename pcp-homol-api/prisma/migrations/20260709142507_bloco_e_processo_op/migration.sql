-- AlterTable
ALTER TABLE "OrdemProducao" ADD COLUMN     "horaAbertura" VARCHAR(8),
ADD COLUMN     "tipoProc" VARCHAR(1);

-- AlterTable
ALTER TABLE "OrdemProducaoOperacao" ADD COLUMN     "ferramentaMatricula" INTEGER,
ADD COLUMN     "indice" INTEGER;

-- CreateTable
CREATE TABLE "ProcessoProdutivo" (
    "id" SERIAL NOT NULL,
    "produtoCodigo" VARCHAR(15) NOT NULL,
    "produtoId" INTEGER,
    "pesoBruto" DECIMAL(6,3),
    "pesoLiquido" DECIMAL(7,3),
    "qtdeOp" INTEGER,
    "producaoHr" INTEGER,
    "materiasPrimas" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProcessoProdutivo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProcessoOperacao" (
    "id" SERIAL NOT NULL,
    "processoId" INTEGER NOT NULL,
    "numeroOperacao" INTEGER NOT NULL,
    "descricao" VARCHAR(60),
    "observacao1" VARCHAR(65),
    "observacao2" VARCHAR(35),
    "plano" VARCHAR(20),
    "secaoCodigo" INTEGER,
    "preparacaoSegundos" INTEGER,
    "producaoSegundos" INTEGER,
    "cacamba" VARCHAR(15),
    "pecas" INTEGER,
    "equipamentoEscolhido" INTEGER,
    "equipamentosTab" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProcessoOperacao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProcessoProdutivo_produtoCodigo_key" ON "ProcessoProdutivo"("produtoCodigo");

-- CreateIndex
CREATE UNIQUE INDEX "ProcessoProdutivo_produtoId_key" ON "ProcessoProdutivo"("produtoId");

-- CreateIndex
CREATE UNIQUE INDEX "ProcessoOperacao_processoId_numeroOperacao_key" ON "ProcessoOperacao"("processoId", "numeroOperacao");

-- CreateIndex
CREATE INDEX "OrdemProducao_produtoCodigo_idx" ON "OrdemProducao"("produtoCodigo");

-- AddForeignKey
ALTER TABLE "ProcessoProdutivo" ADD CONSTRAINT "ProcessoProdutivo_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "Produto"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcessoOperacao" ADD CONSTRAINT "ProcessoOperacao_processoId_fkey" FOREIGN KEY ("processoId") REFERENCES "ProcessoProdutivo"("id") ON DELETE CASCADE ON UPDATE CASCADE;
