/**
 * Layout PCPA41II.DAT — pedidos de MP em aberto
 * Lógico: 32 | passo: 36 | offset: 130
 */

import type { LayoutRegistro } from '../parse-dat';

export const LAYOUT_PCPA41II: LayoutRegistro = {
  nomeArquivo: 'PCPA41II.DAT',
  tamanhoRegistro: 32,
  campos: [
    { nome: 'classeLetra', tipo: 'texto', tamanho: 1 },
    { nome: 'classeNumero', tipo: 'numerico', tamanho: 2 },
    { nome: 'item', tipo: 'numerico', tamanho: 5 },
    { nome: 'pedido', tipo: 'numerico', tamanho: 7 },
    { nome: 'indice', tipo: 'numerico', tamanho: 1 },
    { nome: 'quantidade', tipo: 'texto', tamanho: 9 },
    { nome: 'flag', tipo: 'texto', tamanho: 1 },
    { nome: 'ordemProducao', tipo: 'numerico', tamanho: 6 },
  ],
};
