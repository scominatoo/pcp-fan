/** Layout PCPA66I.DAT — programação de entregas (PC1066 / PC1133) */
import type { LayoutRegistro } from '../parse-dat';

export const LAYOUT_PCPA66I: LayoutRegistro = {
  nomeArquivo: 'PCPA66I.DAT',
  tamanhoRegistro: 105,
  campos: [
    { nome: 'ano', tipo: 'numerico', tamanho: 4 },
    { nome: 'mes', tipo: 'numerico', tamanho: 2 },
    { nome: 'dia', tipo: 'numerico', tamanho: 2 },
    { nome: 'grupo', tipo: 'numerico', tamanho: 3 },
    { nome: 'classificacao', tipo: 'numerico', tamanho: 2 },
    { nome: 'item', tipo: 'numerico', tamanho: 5 },
    { nome: 'plano', tipo: 'texto', tamanho: 2 },
    { nome: 'flag', tipo: 'texto', tamanho: 1 },
    { nome: 'quantidade', tipo: 'numerico', tamanho: 9 },
    { nome: 'pedidoRef', tipo: 'texto', tamanho: 15 },
    { nome: 'pedidoRef2', tipo: 'texto', tamanho: 15 },
    { nome: 'desenhoCliente', tipo: 'texto', tamanho: 15 },
    { nome: 'qtdeEntregue', tipo: 'numerico', tamanho: 9 },
    { nome: 'qtdeAProduzir', tipo: 'numerico', tamanho: 9 },
    { nome: 'qtde2', tipo: 'numerico', tamanho: 9 },
    { nome: 'flagDevolvido', tipo: 'texto', tamanho: 1 },
    { nome: 'filler', tipo: 'texto', tamanho: 2 },
  ],
};
