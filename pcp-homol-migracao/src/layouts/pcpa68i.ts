/**
 * Layout PCPA68I.DAT — saldo planejamento pai/filho
 * Lógico: 71 | passo: 76 | offset: 130
 */

import type { LayoutRegistro } from '../parse-dat';

export const LAYOUT_PCPA68I: LayoutRegistro = {
  nomeArquivo: 'PCPA68I.DAT',
  tamanhoRegistro: 71,
  campos: [
    { nome: 'ano', tipo: 'numerico', tamanho: 4 },
    { nome: 'mes', tipo: 'numerico', tamanho: 2 },
    { nome: 'grupoCodigo', tipo: 'numerico', tamanho: 3 },
    { nome: 'classificacaoCodigo', tipo: 'numerico', tamanho: 2 },
    { nome: 'itemCodigo', tipo: 'numerico', tamanho: 5 },
    { nome: 'prodGrupo', tipo: 'numerico', tamanho: 3 },
    { nome: 'prodClass', tipo: 'numerico', tamanho: 2 },
    { nome: 'prodItem', tipo: 'numerico', tamanho: 5 },
    { nome: 'saldo', tipo: 'texto', tamanho: 12 },
    { nome: 'filler', tipo: 'texto', tamanho: 33 },
  ],
};
