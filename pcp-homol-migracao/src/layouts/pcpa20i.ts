/**
 * Layout PCPA20I.DAT — classificações de produtos (PC1018.COB)
 * Registro lógico: 100 bytes | passo físico indexado: 104 bytes
 */

import type { LayoutRegistro } from '../parse-dat';

export const LAYOUT_PCPA20I: LayoutRegistro = {
  nomeArquivo: 'PCPA20I.DAT',
  tamanhoRegistro: 100,
  campos: [
    { nome: 'codigo', tipo: 'numerico', tamanho: 2 },
    { nome: 'descricao', tipo: 'texto', tamanho: 40 },
    { nome: 'filler', tipo: 'texto', tamanho: 58 },
  ],
};
