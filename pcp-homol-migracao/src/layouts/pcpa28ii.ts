/** Layout PCPA28II.DAT — complemento da OP (cliente) */
import type { LayoutRegistro } from '../parse-dat';

export const LAYOUT_PCPA28II: LayoutRegistro = {
  nomeArquivo: 'PCPA28II.DAT',
  tamanhoRegistro: 168,
  campos: [
    { nome: 'codigo', tipo: 'numerico', tamanho: 8 },
    { nome: 'cliente', tipo: 'texto', tamanho: 40 },
    { nome: 'filler', tipo: 'texto', tamanho: 120 },
  ],
};
