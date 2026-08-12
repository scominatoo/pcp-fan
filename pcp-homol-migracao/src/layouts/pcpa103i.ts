/**
 * Layout PCPA103I.DAT — relação matéria-prima × peça (PRIMA-PECA / PC1103)
 * FD REG-PRIMA-PECA: 23 bytes | passo físico: 28 | offset: 128 | skipIndiceBytes: 2
 * (calibrado 12/08/2026 — ver docs/19-auditoria-completude-op.md)
 *
 * CHAVE-PECA é o mesmo tipo de referência X(15) usada em OP-PRODUTO /
 * PROCESSO-PRODUTO: normalmente o desenho do cliente, não o código
 * composto grupo-classificação-item.
 */

import type { LayoutRegistro } from '../parse-dat';

export const LAYOUT_PCPA103I: LayoutRegistro = {
  nomeArquivo: 'PCPA103I.DAT',
  tamanhoRegistro: 23,
  campos: [
    { nome: 'chavePeca', tipo: 'texto', tamanho: 15 },
    { nome: 'classeLetra', tipo: 'texto', tamanho: 1 },
    { nome: 'classeNumero', tipo: 'numerico', tamanho: 2 },
    { nome: 'item', tipo: 'numerico', tamanho: 5 },
  ],
};
