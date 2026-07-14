/**
 * Layout PCPA106I.DAT — desenho do cliente (PC1106)
 *
 * Registro lógico (FD REG-DESENHO): 192 bytes
 * Passo físico indexado: 196 bytes | offset: 130
 *
 * Observação: PIC S9(06)V999 em DISPLAY com overpunch = 9 bytes cada.
 */

import type { LayoutRegistro } from '../parse-dat';

export const LAYOUT_PCPA106I: LayoutRegistro = {
  nomeArquivo: 'PCPA106I.DAT',
  tamanhoRegistro: 192,
  campos: [
    { nome: 'desenhoCliente', tipo: 'texto', tamanho: 15 },
    { nome: 'branco', tipo: 'texto', tamanho: 5 },
    { nome: 'descricao', tipo: 'texto', tamanho: 40 },
    { nome: 'unidade', tipo: 'texto', tamanho: 3 },
    // S9(06)V999 — lido como texto para preservar dígitos + sinal overpunch
    { nome: 'qtdeEstoque', tipo: 'texto', tamanho: 9 },
    { nome: 'qtdeMin', tipo: 'texto', tamanho: 9 },
    { nome: 'qtdeMax', tipo: 'texto', tamanho: 9 },
    { nome: 'anoUltEnt', tipo: 'numerico', tamanho: 4 },
    { nome: 'mesUltEnt', tipo: 'numerico', tamanho: 2 },
    { nome: 'diaUltEnt', tipo: 'numerico', tamanho: 2 },
    { nome: 'anoUltSai', tipo: 'numerico', tamanho: 4 },
    { nome: 'mesUltSai', tipo: 'numerico', tamanho: 2 },
    { nome: 'diaUltSai', tipo: 'numerico', tamanho: 2 },
    { nome: 'amostra', tipo: 'texto', tamanho: 8 },
    { nome: 'anoAmostra', tipo: 'numerico', tamanho: 4 },
    { nome: 'mesAmostra', tipo: 'numerico', tamanho: 2 },
    { nome: 'diaAmostra', tipo: 'numerico', tamanho: 2 },
    { nome: 'filler', tipo: 'texto', tamanho: 50 },
    { nome: 'sufixo', tipo: 'texto', tamanho: 20 },
  ],
};
