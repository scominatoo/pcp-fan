-- CreateTable
CREATE TABLE "ProdutoGrupo" (
    "id" SERIAL NOT NULL,
    "codigo" INTEGER NOT NULL,
    "descricao" VARCHAR(25) NOT NULL,
    "explosao" VARCHAR(1),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProdutoGrupo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProdutoClassificacao" (
    "id" SERIAL NOT NULL,
    "codigo" INTEGER NOT NULL,
    "descricao" VARCHAR(40) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProdutoClassificacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Produto" (
    "id" SERIAL NOT NULL,
    "grupoCodigo" INTEGER NOT NULL,
    "classificacaoCodigo" INTEGER NOT NULL,
    "itemCodigo" INTEGER NOT NULL,
    "descricao" VARCHAR(40) NOT NULL,
    "unidade" VARCHAR(3),
    "precoCusto" DECIMAL(10,2),
    "precoVenda" DECIMAL(10,2),
    "quantidadeEstoque" DECIMAL(12,3),
    "estoqueMin" DECIMAL(9,3),
    "estoqueMax" DECIMAL(9,3),
    "desenhoSparta" VARCHAR(15),
    "desenhoCliente" VARCHAR(15),
    "planejamento" VARCHAR(1),
    "peso" DECIMAL(7,3),
    "pesoBruto" DECIMAL(6,3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Produto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MateriaPrima" (
    "id" SERIAL NOT NULL,
    "classeLetra" VARCHAR(1) NOT NULL,
    "classeNumero" INTEGER NOT NULL,
    "itemCodigo" INTEGER NOT NULL,
    "descricao" VARCHAR(40) NOT NULL,
    "unidade" VARCHAR(3),
    "espessura" DECIMAL(5,2),
    "comprimento" INTEGER,
    "largura" DECIMAL(8,3),
    "qualidade" VARCHAR(10),
    "dureza" VARCHAR(10),
    "quantidade" DECIMAL(11,2),
    "estoqueMin" DECIMAL(8,2),
    "estoqueMax" DECIMAL(8,2),
    "descricaoCompl1" VARCHAR(60),
    "descricaoCompl2" VARCHAR(75),
    "desenhoCliente" VARCHAR(15),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MateriaPrima_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Equipamento" (
    "id" SERIAL NOT NULL,
    "grupoCodigo" INTEGER NOT NULL,
    "codigo" INTEGER NOT NULL,
    "descricao" VARCHAR(30),
    "modelo" VARCHAR(20),
    "marca" VARCHAR(20),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Equipamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Secao" (
    "id" SERIAL NOT NULL,
    "codigo" INTEGER NOT NULL,
    "descricao" VARCHAR(40),
    "responsavel1" VARCHAR(30),
    "responsavel2" VARCHAR(30),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Secao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DesenhoCliente" (
    "id" SERIAL NOT NULL,
    "desenhoCliente" VARCHAR(15) NOT NULL,
    "descricao" VARCHAR(40),
    "unidade" VARCHAR(3),
    "qtdeEstoque" DECIMAL(9,3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DesenhoCliente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrdemProducao" (
    "id" SERIAL NOT NULL,
    "codigo" INTEGER NOT NULL,
    "produtoCodigo" VARCHAR(15) NOT NULL,
    "produtoId" INTEGER,
    "quantidade" INTEGER NOT NULL,
    "dataAbertura" TIMESTAMP(3),
    "baixada" BOOLEAN NOT NULL DEFAULT false,
    "baixadaMp" BOOLEAN NOT NULL DEFAULT false,
    "baixadaProduto" BOOLEAN NOT NULL DEFAULT false,
    "tipo" VARCHAR(3),
    "clienteNome" VARCHAR(40),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrdemProducao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrdemProducaoOperacao" (
    "id" SERIAL NOT NULL,
    "ordemProducaoId" INTEGER NOT NULL,
    "numeroOperacao" INTEGER NOT NULL,
    "equipamentoGrupo" INTEGER,
    "equipamentoCodigo" INTEGER,
    "ferramentaFabrica" VARCHAR(1),
    "ferramentaNumero" VARCHAR(15),
    "dataEncerramento" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrdemProducaoOperacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProgramacaoEntrega" (
    "id" SERIAL NOT NULL,
    "dataProgramacao" TIMESTAMP(3) NOT NULL,
    "produtoId" INTEGER,
    "grupoCodigo" INTEGER NOT NULL,
    "classificacaoCodigo" INTEGER NOT NULL,
    "itemCodigo" INTEGER NOT NULL,
    "plano" VARCHAR(2),
    "flag" VARCHAR(1),
    "quantidade" INTEGER NOT NULL DEFAULT 0,
    "pedidoRef" VARCHAR(15),
    "pedidoRef2" VARCHAR(15),
    "desenhoCliente" VARCHAR(15),
    "qtdeEntregue" INTEGER NOT NULL DEFAULT 0,
    "qtdeAProduzir" INTEGER NOT NULL DEFAULT 0,
    "devolvido" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProgramacaoEntrega_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MigracaoLog" (
    "id" SERIAL NOT NULL,
    "arquivoOrigem" VARCHAR(64) NOT NULL,
    "registrosLidos" INTEGER NOT NULL,
    "registrosOk" INTEGER NOT NULL,
    "registrosErro" INTEGER NOT NULL,
    "mensagem" TEXT,
    "executadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MigracaoLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProdutoGrupo_codigo_key" ON "ProdutoGrupo"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "ProdutoClassificacao_codigo_key" ON "ProdutoClassificacao"("codigo");

-- CreateIndex
CREATE INDEX "Produto_desenhoCliente_idx" ON "Produto"("desenhoCliente");

-- CreateIndex
CREATE UNIQUE INDEX "Produto_grupoCodigo_classificacaoCodigo_itemCodigo_key" ON "Produto"("grupoCodigo", "classificacaoCodigo", "itemCodigo");

-- CreateIndex
CREATE UNIQUE INDEX "MateriaPrima_classeLetra_classeNumero_itemCodigo_key" ON "MateriaPrima"("classeLetra", "classeNumero", "itemCodigo");

-- CreateIndex
CREATE UNIQUE INDEX "Equipamento_grupoCodigo_codigo_key" ON "Equipamento"("grupoCodigo", "codigo");

-- CreateIndex
CREATE UNIQUE INDEX "Secao_codigo_key" ON "Secao"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "DesenhoCliente_desenhoCliente_key" ON "DesenhoCliente"("desenhoCliente");

-- CreateIndex
CREATE UNIQUE INDEX "OrdemProducao_codigo_key" ON "OrdemProducao"("codigo");

-- CreateIndex
CREATE INDEX "OrdemProducao_baixada_idx" ON "OrdemProducao"("baixada");

-- CreateIndex
CREATE UNIQUE INDEX "OrdemProducaoOperacao_ordemProducaoId_numeroOperacao_key" ON "OrdemProducaoOperacao"("ordemProducaoId", "numeroOperacao");

-- CreateIndex
CREATE INDEX "ProgramacaoEntrega_dataProgramacao_idx" ON "ProgramacaoEntrega"("dataProgramacao");

-- CreateIndex
CREATE INDEX "ProgramacaoEntrega_grupoCodigo_classificacaoCodigo_itemCodi_idx" ON "ProgramacaoEntrega"("grupoCodigo", "classificacaoCodigo", "itemCodigo");

-- AddForeignKey
ALTER TABLE "Produto" ADD CONSTRAINT "Produto_grupoCodigo_fkey" FOREIGN KEY ("grupoCodigo") REFERENCES "ProdutoGrupo"("codigo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Produto" ADD CONSTRAINT "Produto_classificacaoCodigo_fkey" FOREIGN KEY ("classificacaoCodigo") REFERENCES "ProdutoClassificacao"("codigo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrdemProducao" ADD CONSTRAINT "OrdemProducao_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "Produto"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrdemProducaoOperacao" ADD CONSTRAINT "OrdemProducaoOperacao_ordemProducaoId_fkey" FOREIGN KEY ("ordemProducaoId") REFERENCES "OrdemProducao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgramacaoEntrega" ADD CONSTRAINT "ProgramacaoEntrega_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "Produto"("id") ON DELETE SET NULL ON UPDATE CASCADE;
