/**
 * Layout PCPA28I.DAT — ordem de produção (PC1028.COB / PC1041.COB)
 * Tamanho do registro: 62 bytes
 */

import type { LayoutRegistro } from '../parse-dat';

export const LAYOUT_PCPA28I: LayoutRegistro = {
  nomeArquivo: 'PCPA28I.DAT',
  tamanhoRegistro: 62,
  campos: [
    { nome: 'codigo', tipo: 'numerico', tamanho: 8 },
    { nome: 'produto', tipo: 'texto', tamanho: 15 },
    { nome: 'quantidade', tipo: 'numerico', tamanho: 7 },
    { nome: 'ano', tipo: 'numerico', tamanho: 4 },
    { nome: 'mes', tipo: 'numerico', tamanho: 2 },
    { nome: 'dia', tipo: 'numerico', tamanho: 2 },
    { nome: 'baixada', tipo: 'texto', tamanho: 1 },
    { nome: 'baixadaMp', tipo: 'texto', tamanho: 1 },
    { nome: 'baixadaProduto', tipo: 'texto', tamanho: 1 },
    { nome: 'tipoProc', tipo: 'texto', tamanho: 1 },
    { nome: 'filler1', tipo: 'texto', tamanho: 7 },
    { nome: 'hora', tipo: 'numerico', tamanho: 2 },
    { nome: 'minuto', tipo: 'numerico', tamanho: 2 },
    { nome: 'segundo', tipo: 'numerico', tamanho: 2 },
    { nome: 'tipo', tipo: 'texto', tamanho: 3 },
    { nome: 'filler2', tipo: 'texto', tamanho: 4 },
  ],
};
