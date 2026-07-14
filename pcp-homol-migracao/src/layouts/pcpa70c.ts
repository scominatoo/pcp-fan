/**
 * Layout PCPA70C.DAT — complemento de MPs do processo (PC1070)
 *
 * Registro lógico (FD REG-COMP-PROCESSO): 131 bytes
 * Passo físico: 134 | offset: 130
 *
 * No dump FANANDRI atual o arquivo é minúsculo (~1 registro útil).
 */

import type { LayoutRegistro } from '../parse-dat';

export const LAYOUT_PCPA70C: LayoutRegistro = {
  nomeArquivo: 'PCPA70C.DAT',
  tamanhoRegistro: 131,
  campos: [
    { nome: 'produto', tipo: 'texto', tamanho: 15 },
    // 5 MPs: classe(3) + item(5) + peso 9(03)V9(08)=11 → 19 × 5 = 95
    { nome: 'mp1Classe', tipo: 'texto', tamanho: 3 },
    { nome: 'mp1Item', tipo: 'numerico', tamanho: 5 },
    { nome: 'mp1Peso', tipo: 'texto', tamanho: 11 },
    { nome: 'mp2Classe', tipo: 'texto', tamanho: 3 },
    { nome: 'mp2Item', tipo: 'numerico', tamanho: 5 },
    { nome: 'mp2Peso', tipo: 'texto', tamanho: 11 },
    { nome: 'mp3Classe', tipo: 'texto', tamanho: 3 },
    { nome: 'mp3Item', tipo: 'numerico', tamanho: 5 },
    { nome: 'mp3Peso', tipo: 'texto', tamanho: 11 },
    { nome: 'mp4Classe', tipo: 'texto', tamanho: 3 },
    { nome: 'mp4Item', tipo: 'numerico', tamanho: 5 },
    { nome: 'mp4Peso', tipo: 'texto', tamanho: 11 },
    { nome: 'mp5Classe', tipo: 'texto', tamanho: 3 },
    { nome: 'mp5Item', tipo: 'numerico', tamanho: 5 },
    { nome: 'mp5Peso', tipo: 'texto', tamanho: 11 },
    { nome: 'filler', tipo: 'texto', tamanho: 21 },
  ],
};
