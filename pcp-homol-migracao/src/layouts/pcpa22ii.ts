/**
 * Layout PCPA22II.DAT — complemento de matéria-prima (descrições / preço)
 * FD REG-PRIMA-C: 223 bytes | passo físico: 228 | offset: 130
 */

import type { LayoutRegistro } from '../parse-dat';

export const LAYOUT_PCPA22II: LayoutRegistro = {
  nomeArquivo: 'PCPA22II.DAT',
  tamanhoRegistro: 223,
  campos: [
    { nome: 'classeLetra', tipo: 'texto', tamanho: 1 },
    { nome: 'classeNumero', tipo: 'numerico', tamanho: 2 },
    { nome: 'item', tipo: 'numerico', tamanho: 5 },
    { nome: 'descricao1', tipo: 'texto', tamanho: 60 },
    { nome: 'descricao2', tipo: 'texto', tamanho: 75 },
    { nome: 'tolCompMax', tipo: 'texto', tamanho: 4 },
    { nome: 'tolCompMin', tipo: 'texto', tamanho: 4 },
    { nome: 'roloDExt', tipo: 'texto', tamanho: 7 },
    { nome: 'roloDInt', tipo: 'texto', tamanho: 7 },
    { nome: 'roloPeso', tipo: 'texto', tamanho: 6 },
    { nome: 'precoCompra', tipo: 'texto', tamanho: 10 },
    { nome: 'filler', tipo: 'texto', tamanho: 42 },
  ],
};
