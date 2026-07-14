/**
 * Layout PCPA73I.DAT — NRMP (PC1073)
 * Lógico: 246 | passo: 248 | offset: 130
 */

import type { LayoutRegistro } from '../parse-dat';

export const LAYOUT_PCPA73I: LayoutRegistro = {
  nomeArquivo: 'PCPA73I.DAT',
  tamanhoRegistro: 246,
  campos: [
    { nome: 'letra', tipo: 'texto', tamanho: 2 },
    { nome: 'numero', tipo: 'numerico', tamanho: 6 },
    { nome: 'letra2', tipo: 'texto', tamanho: 2 },
    { nome: 'branco', tipo: 'texto', tamanho: 8 },
    { nome: 'classeLetra', tipo: 'texto', tamanho: 1 },
    { nome: 'classeNumero', tipo: 'numerico', tamanho: 2 },
    { nome: 'item', tipo: 'numerico', tamanho: 5 },
    { nome: 'ano', tipo: 'numerico', tamanho: 4 },
    { nome: 'mes', tipo: 'numerico', tamanho: 2 },
    { nome: 'dia', tipo: 'numerico', tamanho: 2 },
    { nome: 'fornecedor', tipo: 'numerico', tamanho: 5 },
    { nome: 'nota', tipo: 'numerico', tamanho: 8 },
    { nome: 'serie', tipo: 'texto', tamanho: 2 },
    { nome: 'corrida', tipo: 'texto', tamanho: 10 },
    { nome: 'quantidade', tipo: 'texto', tamanho: 9 },
    { nome: 'valorUnitario', tipo: 'texto', tamanho: 12 },
    { nome: 'produto', tipo: 'texto', tamanho: 10 },
    { nome: 'ofCodigo', tipo: 'texto', tamanho: 15 },
    { nome: 'filler', tipo: 'texto', tamanho: 141 },
  ],
};
