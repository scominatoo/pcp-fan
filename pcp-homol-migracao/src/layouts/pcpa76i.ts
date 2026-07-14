/** Layout PCPA76I.DAT — movimento de MP (PC1076) */
import type { LayoutRegistro } from '../parse-dat';

export const LAYOUT_PCPA76I: LayoutRegistro = {
  nomeArquivo: 'PCPA76I.DAT',
  tamanhoRegistro: 66,
  campos: [
    { nome: 'loteLetra', tipo: 'texto', tamanho: 2 },
    { nome: 'loteNumero', tipo: 'numerico', tamanho: 6 },
    { nome: 'loteLetra2', tipo: 'texto', tamanho: 2 },
    { nome: 'indice', tipo: 'numerico', tamanho: 9 },
    { nome: 'tipo', tipo: 'texto', tamanho: 1 },
    { nome: 'ano', tipo: 'numerico', tamanho: 4 },
    { nome: 'mes', tipo: 'numerico', tamanho: 2 },
    { nome: 'dia', tipo: 'numerico', tamanho: 2 },
    { nome: 'nota', tipo: 'numerico', tamanho: 8 },
    { nome: 'classeLetra', tipo: 'texto', tamanho: 1 },
    { nome: 'classeNumero', tipo: 'numerico', tamanho: 2 },
    { nome: 'itemCodigo', tipo: 'numerico', tamanho: 5 },
    { nome: 'qtdeRolos', tipo: 'numerico', tamanho: 4 },
    { nome: 'qtdeInt', tipo: 'numerico', tamanho: 6 },
    { nome: 'qtdeDec', tipo: 'numerico', tamanho: 2 },
    { nome: 'flag', tipo: 'texto', tamanho: 3 },
    { nome: 'filler', tipo: 'texto', tamanho: 13 },
  ],
};
