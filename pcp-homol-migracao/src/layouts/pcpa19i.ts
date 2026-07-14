/**
 * Layout PCPA19I.DAT — grupos de produtos (PC1018.COB)
 * Registro lógico: 101 bytes | passo físico indexado: 104 bytes
 */

import type { LayoutRegistro } from '../parse-dat';

export const LAYOUT_PCPA19I: LayoutRegistro = {
  nomeArquivo: 'PCPA19I.DAT',
  tamanhoRegistro: 101,
  campos: [
    { nome: 'codigo', tipo: 'numerico', tamanho: 3 },
    { nome: 'descricao', tipo: 'texto', tamanho: 25 },
    { nome: 'explosao', tipo: 'texto', tamanho: 1 },
    { nome: 'filler', tipo: 'texto', tamanho: 72 },
  ],
};
