/**
 * Layout PCPA64I.DAT — equipamentos (PC1064)
 *
 * Registro lógico (FD REG-EQPTO): 288 bytes
 * Passo físico indexado: 292 bytes | offset: 130
 *
 * Horários semanais e custos ficam em filler — Pacote A traz só identificação
 * (grupo/código/descrição/modelo/marca), o suficiente para emissão de OP.
 */

import type { LayoutRegistro } from '../parse-dat';

export const LAYOUT_PCPA64I: LayoutRegistro = {
  nomeArquivo: 'PCPA64I.DAT',
  tamanhoRegistro: 288,
  campos: [
    { nome: 'grupoCodigo', tipo: 'numerico', tamanho: 2 },
    { nome: 'codigo', tipo: 'numerico', tamanho: 4 },
    { nome: 'descricao', tipo: 'texto', tamanho: 30 },
    { nome: 'modelo', tipo: 'texto', tamanho: 20 },
    { nome: 'marca', tipo: 'texto', tamanho: 20 },
    { nome: 'ano', tipo: 'numerico', tamanho: 2 },
    { nome: 'capacidade', tipo: 'texto', tamanho: 20 },
    { nome: 'qtde', tipo: 'numerico', tamanho: 2 },
    // custos 8+8+8 + tab horários 112 + filler 52 = 188
    { nome: 'restante', tipo: 'texto', tamanho: 188 },
  ],
};
