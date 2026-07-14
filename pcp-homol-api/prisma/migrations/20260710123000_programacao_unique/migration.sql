-- CreateIndex
CREATE UNIQUE INDEX "ProgramacaoEntrega_dataProgramacao_grupoCodigo_classificacaoCodigo_itemCodigo_plano_flag_desenhoCliente_key" ON "ProgramacaoEntrega"("dataProgramacao", "grupoCodigo", "classificacaoCodigo", "itemCodigo", "plano", "flag", "desenhoCliente");
