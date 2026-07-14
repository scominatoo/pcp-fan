/** Layout PCPA71I.DAT — baixa consolidada da OP (PC1028) */
import type { LayoutRegistro } from '../parse-dat';

export const LAYOUT_PCPA71I: LayoutRegistro = {
  nomeArquivo: 'PCPA71I.DAT',
  tamanhoRegistro: 310,
  campos: [
    { nome: 'codigoOp', tipo: 'numerico', tamanho: 8 },
    { nome: 'anoBaixa', tipo: 'numerico', tamanho: 4 },
    { nome: 'mesBaixa', tipo: 'numerico', tamanho: 2 },
    { nome: 'diaBaixa', tipo: 'numerico', tamanho: 2 },
    { nome: 'horaBaixaHh', tipo: 'numerico', tamanho: 2 },
    { nome: 'horaBaixaMm', tipo: 'numerico', tamanho: 2 },
    { nome: 'pecasProduzidas', tipo: 'numerico', tamanho: 6 },
    { nome: 'mpConsumida', tipo: 'numerico', tamanho: 6 },
    { nome: 'rolos', tipo: 'numerico', tamanho: 4 },
    { nome: 'temposRaw', tipo: 'texto', tamanho: 250 },
    { nome: 'turno1', tipo: 'numerico', tamanho: 6 },
    { nome: 'turno2', tipo: 'numerico', tamanho: 6 },
    { nome: 'filler', tipo: 'texto', tamanho: 12 },
  ],
};
