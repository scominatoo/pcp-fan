/**
 * Layout PCPA73II.DAT — consulta/índice NRMP
 * Lógico: 106 | passo: 106 | offset: 130 (arquivo minúsculo)
 */

import type { LayoutRegistro } from '../parse-dat';

export const LAYOUT_PCPA73II: LayoutRegistro = {
  nomeArquivo: 'PCPA73II.DAT',
  tamanhoRegistro: 106,
  campos: [
    { nome: 'letra', tipo: 'texto', tamanho: 2 },
    { nome: 'numero', tipo: 'numerico', tamanho: 6 },
    { nome: 'letra2', tipo: 'texto', tamanho: 2 },
    { nome: 'nota', tipo: 'numerico', tamanho: 8 },
    { nome: 'tipo', tipo: 'texto', tamanho: 1 },
    { nome: 'indice', tipo: 'texto', tamanho: 12 },
    { nome: 'ano', tipo: 'numerico', tamanho: 4 },
    { nome: 'mes', tipo: 'numerico', tamanho: 2 },
    { nome: 'dia', tipo: 'numerico', tamanho: 2 },
    { nome: 'pedido', tipo: 'numerico', tamanho: 8 },
    { nome: 'quantidade', tipo: 'texto', tamanho: 9 },
    { nome: 'tipoNota', tipo: 'texto', tamanho: 3 },
    { nome: 'filler', tipo: 'texto', tamanho: 47 },
  ],
};
