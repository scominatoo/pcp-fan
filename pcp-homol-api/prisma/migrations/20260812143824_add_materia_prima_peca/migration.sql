-- CreateTable
CREATE TABLE "MateriaPrimaPeca" (
    "id" SERIAL NOT NULL,
    "produtoCodigo" VARCHAR(15) NOT NULL,
    "produtoId" INTEGER,
    "classeLetra" VARCHAR(1) NOT NULL,
    "classeNumero" INTEGER NOT NULL,
    "itemCodigo" INTEGER NOT NULL,
    "materiaPrimaId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MateriaPrimaPeca_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MateriaPrimaPeca_produtoCodigo_classeLetra_classeNumero_ite_key" ON "MateriaPrimaPeca"("produtoCodigo", "classeLetra", "classeNumero", "itemCodigo");

-- AddForeignKey
ALTER TABLE "MateriaPrimaPeca" ADD CONSTRAINT "MateriaPrimaPeca_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "Produto"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MateriaPrimaPeca" ADD CONSTRAINT "MateriaPrimaPeca_materiaPrimaId_fkey" FOREIGN KEY ("materiaPrimaId") REFERENCES "MateriaPrima"("id") ON DELETE SET NULL ON UPDATE CASCADE;
