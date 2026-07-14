/** Layout PCPA70XI.DAT — roteiro de operações do processo */
import type { LayoutRegistro } from '../parse-dat';

export const LAYOUT_PCPA70XI: LayoutRegistro = {
  nomeArquivo: 'PCPA70XI.DAT',
  tamanhoRegistro: 668,
  campos: [
    { nome: 'produto', tipo: 'texto', tamanho: 15 },
    { nome: 'numeroOperacao', tipo: 'numerico', tamanho: 2 },
    { nome: 'descricao', tipo: 'texto', tamanho: 60 },
    { nome: 'obs1', tipo: 'texto', tamanho: 65 },
    { nome: 'obs2', tipo: 'texto', tamanho: 35 },
    { nome: 'plano', tipo: 'texto', tamanho: 20 },
    { nome: 'secaoCodigo', tipo: 'numerico', tamanho: 3 },
    { nome: 'prepHr', tipo: 'numerico', tamanho: 3 },
    { nome: 'prepMn', tipo: 'numerico', tamanho: 2 },
    { nome: 'prepSg', tipo: 'numerico', tamanho: 2 },
    { nome: 'prodHr', tipo: 'numerico', tamanho: 3 },
    { nome: 'prodMn', tipo: 'numerico', tamanho: 2 },
    { nome: 'prodSg', tipo: 'numerico', tamanho: 2 },
    { nome: 'cacamba', tipo: 'texto', tamanho: 15 },
    { nome: 'pecas', tipo: 'numerico', tamanho: 6 },
    // PROC-OP-TAB × 15: eqpto(6) + ferramenta(18) = 24 × 15 = 360
    { nome: 'tabRaw', tipo: 'texto', tamanho: 360 },
    { nome: 'equipamentoEscolhido', tipo: 'numerico', tamanho: 2 },
    { nome: 'filler', tipo: 'texto', tamanho: 71 },
  ],
};
