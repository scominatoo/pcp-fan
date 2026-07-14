-- Pacote C: complemento MP (PCPA22II/PCPA22B) + clientes (PCPA04I)

ALTER TABLE "MateriaPrima" ADD COLUMN IF NOT EXISTS "precoCompra" DECIMAL(10,3);
ALTER TABLE "MateriaPrima" ADD COLUMN IF NOT EXISTS "complementoExtra" JSONB;

CREATE TABLE IF NOT EXISTS "Cliente" (
    "id" SERIAL NOT NULL,
    "codigo" INTEGER NOT NULL,
    "empresa" VARCHAR(40) NOT NULL,
    "sufixo" VARCHAR(20),
    "endereco" VARCHAR(40),
    "enderecoCobranca" VARCHAR(40),
    "cidade" VARCHAR(20),
    "estado" VARCHAR(2),
    "cep" VARCHAR(8),
    "bairro" VARCHAR(20),
    "telefone1" VARCHAR(9),
    "telefone2" VARCHAR(9),
    "ddd" INTEGER,
    "cgc" VARCHAR(18),
    "inscricaoEstadual" VARCHAR(18),
    "ccm" VARCHAR(18),
    "contato1" VARCHAR(14),
    "contato2" VARCHAR(14),
    "fax" VARCHAR(9),
    "tipo" VARCHAR(1),
    "vendedorCodigo" INTEGER,
    "enderecoEntrega" VARCHAR(40),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cliente_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Cliente_codigo_key" ON "Cliente"("codigo");
CREATE INDEX IF NOT EXISTS "Cliente_empresa_idx" ON "Cliente"("empresa");
CREATE INDEX IF NOT EXISTS "Cliente_cgc_idx" ON "Cliente"("cgc");
