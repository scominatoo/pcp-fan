/**
 * Layout PCPA22B.DAT — desenho e textos extras da MP
 * FD REG-PRIMA-C2: 768 bytes | passo físico: 772 | offset: 130
 */

import type { LayoutRegistro } from '../parse-dat';

export const LAYOUT_PCPA22B: LayoutRegistro = {
  nomeArquivo: 'PCPA22B.DAT',
  tamanhoRegistro: 768,
  campos: [
    { nome: 'classeLetra', tipo: 'texto', tamanho: 1 },
    { nome: 'classeNumero', tipo: 'numerico', tamanho: 2 },
    { nome: 'item', tipo: 'numerico', tamanho: 5 },
    { nome: 'desenhoCliente', tipo: 'texto', tamanho: 15 },
    { nome: 'descricao3', tipo: 'texto', tamanho: 75 },
    { nome: 'descricao4', tipo: 'texto', tamanho: 75 },
    { nome: 'descricao5', tipo: 'texto', tamanho: 75 },
    { nome: 'descricao6', tipo: 'texto', tamanho: 75 },
    { nome: 'embalagem1', tipo: 'texto', tamanho: 45 },
    { nome: 'embalagem2', tipo: 'texto', tamanho: 70 },
    { nome: 'embalagem3', tipo: 'texto', tamanho: 70 },
    { nome: 'embalagem4', tipo: 'texto', tamanho: 70 },
    { nome: 'embalagem5', tipo: 'texto', tamanho: 70 },
    { nome: 'embalagem6', tipo: 'texto', tamanho: 70 },
    { nome: 'filler', tipo: 'texto', tamanho: 50 },
  ],
};
