/** Layout PCPA109I.DAT — baixa MP por OP (PC1109) */
import type { LayoutRegistro } from '../parse-dat';

export const LAYOUT_PCPA109I: LayoutRegistro = {
  nomeArquivo: 'PCPA109I.DAT',
  tamanhoRegistro: 54,
  campos: [
    { nome: 'codigoOp', tipo: 'numerico', tamanho: 8 },
    { nome: 'classeLetra', tipo: 'texto', tamanho: 1 },
    { nome: 'classeNumero', tipo: 'numerico', tamanho: 2 },
    { nome: 'itemCodigo', tipo: 'numerico', tamanho: 5 },
    { nome: 'qtdeRolos', tipo: 'numerico', tamanho: 4 },
    { nome: 'qtdeInt', tipo: 'numerico', tamanho: 6 },
    { nome: 'qtdeDec', tipo: 'numerico', tamanho: 2 },
    { nome: 'ano', tipo: 'numerico', tamanho: 4 },
    { nome: 'mes', tipo: 'numerico', tamanho: 2 },
    { nome: 'dia', tipo: 'numerico', tamanho: 2 },
    { nome: 'flag', tipo: 'texto', tamanho: 3 },
    { nome: 'filler', tipo: 'texto', tamanho: 15 },
  ],
};
