/**
 * Layout PCPA69I.DAT — seções de produção (PC1069)
 *
 * Registro lógico (FD REG-SECAO): 256 bytes
 * Passo físico indexado: 260 bytes | offset: 130
 *
 * MAQUINA OCCURS 14 (8 bytes cada = 112) fica em filler — não entra no Pacote A.
 */

import type { LayoutRegistro } from '../parse-dat';

export const LAYOUT_PCPA69I: LayoutRegistro = {
  nomeArquivo: 'PCPA69I.DAT',
  tamanhoRegistro: 256,
  campos: [
    { nome: 'codigo', tipo: 'numerico', tamanho: 3 },
    { nome: 'descricao', tipo: 'texto', tamanho: 40 },
    { nome: 'responsavel1', tipo: 'texto', tamanho: 30 },
    { nome: 'responsavel2', tipo: 'texto', tamanho: 30 },
    // 14 × (grupo 2 + eqpto 4 + qtde 2) = 112
    { nome: 'maquinas', tipo: 'texto', tamanho: 112 },
    { nome: 'filler', tipo: 'texto', tamanho: 41 },
  ],
};
