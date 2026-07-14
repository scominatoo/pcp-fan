/** Layout PCPA28E.DAT — operações da OP */
import type { LayoutRegistro } from '../parse-dat';

export const LAYOUT_PCPA28E: LayoutRegistro = {
  nomeArquivo: 'PCPA28E.DAT',
  tamanhoRegistro: 74,
  campos: [
    { nome: 'codigoOp', tipo: 'numerico', tamanho: 8 },
    { nome: 'numeroOperacao', tipo: 'numerico', tamanho: 2 },
    { nome: 'spaces', tipo: 'texto', tamanho: 6 },
    { nome: 'equipamentoGrupo', tipo: 'numerico', tamanho: 2 },
    { nome: 'equipamentoCodigo', tipo: 'numerico', tamanho: 4 },
    { nome: 'indice', tipo: 'numerico', tamanho: 2 },
    { nome: 'ferramentaFabrica', tipo: 'texto', tamanho: 1 },
    { nome: 'ferramentaNumero', tipo: 'texto', tamanho: 15 },
    { nome: 'ferramentaMatricula', tipo: 'numerico', tamanho: 2 },
    { nome: 'anoEncerramento', tipo: 'numerico', tamanho: 4 },
    { nome: 'mesEncerramento', tipo: 'numerico', tamanho: 2 },
    { nome: 'diaEncerramento', tipo: 'numerico', tamanho: 2 },
    { nome: 'filler', tipo: 'texto', tamanho: 24 },
  ],
};
