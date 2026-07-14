/**
 * Layout do arquivo PCPA18I.DAT — cadastro de produtos (PC1018.COB)
 * Tamanho do registro lógico: 287 bytes (FD REG-PRODUTOS)
 * Passo físico no arquivo indexado: 292 bytes (ver ler-indexed-dat.ts)
 */

import type { LayoutRegistro } from '../parse-dat';

export const LAYOUT_PCPA18I: LayoutRegistro = {
  nomeArquivo: 'PCPA18I.DAT',
  tamanhoRegistro: 287,
  campos: [
    { nome: 'grupo', tipo: 'numerico', tamanho: 3 },
    { nome: 'classificacao', tipo: 'numerico', tamanho: 2 },
    { nome: 'item', tipo: 'numerico', tamanho: 5 },
    { nome: 'descricao', tipo: 'texto', tamanho: 40 },
    { nome: 'unidade', tipo: 'texto', tamanho: 3 },
    { nome: 'precoCusto', tipo: 'numerico', tamanho: 10 },
    { nome: 'estoqueProcesso', tipo: 'numerico', tamanho: 8 },
    { nome: 'precoVenda', tipo: 'numerico', tamanho: 10 },
    { nome: 'codigoFiscal', tipo: 'texto', tamanho: 1 },
    { nome: 'codigoTribut', tipo: 'texto', tamanho: 1 },
    { nome: 'classifAbc', tipo: 'texto', tamanho: 1 },
    { nome: 'percentIpi', tipo: 'numerico', tamanho: 3 },
    { nome: 'peso', tipo: 'numerico', tamanho: 7 },
    { nome: 'dataUltEnt', tipo: 'numerico', tamanho: 8 },
    { nome: 'dataUltSai', tipo: 'numerico', tamanho: 8 },
    { nome: 'estoqueMin', tipo: 'numerico', tamanho: 9 },
    { nome: 'estoqueMax', tipo: 'numerico', tamanho: 9 },
    { nome: 'quantidade', tipo: 'numerico', tamanho: 12 },
    { nome: 'valor', tipo: 'numerico', tamanho: 14 },
    { nome: 'desenhoSparta', tipo: 'texto', tamanho: 15 },
    { nome: 'desenhoCliente', tipo: 'texto', tamanho: 15 },
    { nome: 'planejamento', tipo: 'texto', tamanho: 1 },
    { nome: 'pesoBruto', tipo: 'numerico', tamanho: 6 },
    { nome: 'qtdeEmbInt', tipo: 'numerico', tamanho: 8 },
    { nome: 'descarga', tipo: 'texto', tamanho: 15 },
    { nome: 'dtUltPreco', tipo: 'numerico', tamanho: 8 },
    { nome: 'classifAbc2', tipo: 'texto', tamanho: 1 },
    { nome: 'almox', tipo: 'texto', tamanho: 4 },
    { nome: 'delivery', tipo: 'texto', tamanho: 6 },
    { nome: 'using', tipo: 'texto', tamanho: 6 },
    { nome: 'embalagem', tipo: 'numerico', tamanho: 6 },
    { nome: 'eqpto', tipo: 'texto', tamanho: 6 },
    { nome: 'ferramenta', tipo: 'texto', tamanho: 10 },
    { nome: 'filler', tipo: 'texto', tamanho: 26 },
  ],
};