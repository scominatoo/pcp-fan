-- Pacote B: complemento de processo (PCPA70C) + ferramentas (PCPA129I)

ALTER TABLE "ProcessoProdutivo" ADD COLUMN IF NOT EXISTS "materiasPrimasComplemento" JSONB;

CREATE TABLE IF NOT EXISTS "Ferramenta" (
    "id" SERIAL NOT NULL,
    "fabrica" VARCHAR(1) NOT NULL,
    "numero" VARCHAR(15) NOT NULL,
    "matricula" INTEGER NOT NULL,
    "cavidade" INTEGER,
    "sufixo" VARCHAR(10),
    "descricao" VARCHAR(30),
    "checkList" VARCHAR(10),
    "limiteAfiacao" INTEGER,
    "acumGolpes" INTEGER,
    "dataInicio" TIMESTAMP(3),
    "dataFim" TIMESTAMP(3),
    "plContNr" INTEGER,
    "materiasPrimas" JSONB,
    "relacionamentos" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Ferramenta_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Ferramenta_fabrica_numero_matricula_key"
  ON "Ferramenta"("fabrica", "numero", "matricula");

CREATE INDEX IF NOT EXISTS "Ferramenta_numero_idx" ON "Ferramenta"("numero");
