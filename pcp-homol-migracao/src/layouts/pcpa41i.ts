/**
 * Layout PCPA41I.DAT — pedido de compra MP (PC1041 / PC1034)
 * Lógico: 1863 | passo: 1868 | offset: 130
 *
 * Itens (×8) e NFs (×20 COMP-3) são parseados no script a partir do offset 371.
 */

import type { LayoutRegistro } from '../parse-dat';

export const LAYOUT_PCPA41I: LayoutRegistro = {
  nomeArquivo: 'PCPA41I.DAT',
  tamanhoRegistro: 1863,
  campos: [
    { nome: 'codigo', tipo: 'numerico', tamanho: 7 },
    { nome: 'spaces', tipo: 'texto', tamanho: 5 },
    { nome: 'pedidoFornecedor', tipo: 'numerico', tamanho: 7 },
    { nome: 'ipi', tipo: 'texto', tamanho: 4 },
    { nome: 'despesasFin', tipo: 'texto', tamanho: 4 },
    { nome: 'frete', tipo: 'texto', tamanho: 8 },
    { nome: 'codTransp', tipo: 'numerico', tamanho: 3 },
    { nome: 'cond1', tipo: 'numerico', tamanho: 3 },
    { nome: 'cond2', tipo: 'numerico', tamanho: 3 },
    { nome: 'cond3', tipo: 'numerico', tamanho: 3 },
    { nome: 'mensagemFlag', tipo: 'texto', tamanho: 1 },
    { nome: 'flag', tipo: 'texto', tamanho: 1 },
    { nome: 'mensagens', tipo: 'texto', tamanho: 240 },
    { nome: 'desconto', tipo: 'texto', tamanho: 4 },
    { nome: 'cancela', tipo: 'texto', tamanho: 3 },
    { nome: 'liberacao', tipo: 'texto', tamanho: 3 },
    { nome: 'localEntrega', tipo: 'texto', tamanho: 25 },
    { nome: 'nomeFornecedor', tipo: 'texto', tamanho: 15 },
    { nome: 'codFornecedor', tipo: 'numerico', tamanho: 5 },
    { nome: 'branco', tipo: 'texto', tamanho: 3 },
    { nome: 'dtLib', tipo: 'numerico', tamanho: 8 },
    { nome: 'dtReq', tipo: 'numerico', tamanho: 8 },
    { nome: 'anoPedido', tipo: 'numerico', tamanho: 4 },
    { nome: 'mesPedido', tipo: 'numerico', tamanho: 2 },
    { nome: 'diaPedido', tipo: 'numerico', tamanho: 2 },
    // 8×116 itens + 20×25 NF + footer = 1492
    { nome: 'restante', tipo: 'texto', tamanho: 1492 },
  ],
};

/** Offset do primeiro item da tabela complementar dentro do registro lógico */
export const PCPA41I_ITENS_OFFSET = 371;
/** Tamanho de cada item da tab (8 ocorrências) */
export const PCPA41I_ITEM_SIZE = 116;
/** Offset de PD-OP (após NF 500 bytes + data entrega 8 + cliente 5 + depto 10 + setor 10 + cond 10) */
export const PCPA41I_OP_OFFSET = 371 + 8 * 116 + 500 + 8 + 5 + 10 + 10 + 10; // 1842
