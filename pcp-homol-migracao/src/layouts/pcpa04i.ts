/**
 * Layout PCPA04I.DAT — clientes (PC1004)
 * FD REG-CLIENTE: 524 bytes | passo físico: 528 | offset: 130
 *
 * Campos comerciais avançados (fatura, comissão, acumulo) vão em filler
 * no Pacote C — migramos o essencial para lookup na OP.
 */

import type { LayoutRegistro } from '../parse-dat';

export const LAYOUT_PCPA04I: LayoutRegistro = {
  nomeArquivo: 'PCPA04I.DAT',
  tamanhoRegistro: 524,
  campos: [
    { nome: 'codigo', tipo: 'numerico', tamanho: 5 },
    { nome: 'empresa', tipo: 'texto', tamanho: 40 },
    { nome: 'sufixo', tipo: 'texto', tamanho: 20 },
    { nome: 'endereco', tipo: 'texto', tamanho: 40 },
    { nome: 'enderecoCobranca', tipo: 'texto', tamanho: 40 },
    { nome: 'cidade', tipo: 'texto', tamanho: 20 },
    { nome: 'estado', tipo: 'texto', tamanho: 2 },
    { nome: 'cep1', tipo: 'texto', tamanho: 5 },
    { nome: 'cep2', tipo: 'texto', tamanho: 3 },
    { nome: 'telefone1', tipo: 'texto', tamanho: 9 },
    { nome: 'telefone2', tipo: 'texto', tamanho: 9 },
    { nome: 'telefone3', tipo: 'texto', tamanho: 9 },
    { nome: 'telefone4', tipo: 'texto', tamanho: 9 },
    { nome: 'telefone5', tipo: 'texto', tamanho: 9 },
    { nome: 'ddd', tipo: 'numerico', tamanho: 4 },
    { nome: 'vendedor', tipo: 'numerico', tamanho: 3 },
    { nome: 'ccm', tipo: 'texto', tamanho: 18 },
    { nome: 'inscricao', tipo: 'texto', tamanho: 18 },
    { nome: 'cgc', tipo: 'texto', tamanho: 18 },
    { nome: 'contato1', tipo: 'texto', tamanho: 14 },
    { nome: 'contato2', tipo: 'texto', tamanho: 14 },
    { nome: 'contato3', tipo: 'texto', tamanho: 14 },
    { nome: 'ddi', tipo: 'numerico', tamanho: 4 },
    { nome: 'fax', tipo: 'texto', tamanho: 9 },
    { nome: 'telex', tipo: 'texto', tamanho: 10 },
    { nome: 'sparta', tipo: 'numerico', tamanho: 6 },
    { nome: 'entrega', tipo: 'texto', tamanho: 40 },
    // comissão(4)+fatura(14)+data(8)+acumulo(14)+pgto(2)+transp(3)+tipo(1)
    // +cidade2(20)+estado2(2)+cep22(5)+cep221(3)+bairro(20)+filler(36) = 132
    { nome: 'comissao', tipo: 'texto', tamanho: 4 },
    { nome: 'fatura', tipo: 'texto', tamanho: 14 },
    { nome: 'anoUltCompra', tipo: 'numerico', tamanho: 4 },
    { nome: 'mesUltCompra', tipo: 'numerico', tamanho: 2 },
    { nome: 'diaUltCompra', tipo: 'numerico', tamanho: 2 },
    { nome: 'acumulo', tipo: 'texto', tamanho: 14 },
    { nome: 'pgto', tipo: 'numerico', tamanho: 2 },
    { nome: 'transportadora', tipo: 'numerico', tamanho: 3 },
    { nome: 'tipo', tipo: 'texto', tamanho: 1 },
    { nome: 'cidade2', tipo: 'texto', tamanho: 20 },
    { nome: 'estado2', tipo: 'texto', tamanho: 2 },
    { nome: 'cep22', tipo: 'texto', tamanho: 5 },
    { nome: 'cep221', tipo: 'texto', tamanho: 3 },
    { nome: 'bairro', tipo: 'texto', tamanho: 20 },
    { nome: 'filler', tipo: 'texto', tamanho: 36 },
  ],
};
