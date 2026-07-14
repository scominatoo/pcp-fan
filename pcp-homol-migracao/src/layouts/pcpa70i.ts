/** Layout PCPA70I.DAT — cabeçalho do processo produtivo (PC1070) */
import type { LayoutRegistro } from '../parse-dat';

export const LAYOUT_PCPA70I: LayoutRegistro = {
  nomeArquivo: 'PCPA70I.DAT',
  tamanhoRegistro: 146,
  campos: [
    { nome: 'produto', tipo: 'texto', tamanho: 15 },
    // 5 MPs: classe(3) + item(5) + peso(11) = 19 × 5 = 95
    { nome: 'mp1Classe', tipo: 'texto', tamanho: 3 },
    { nome: 'mp1Item', tipo: 'numerico', tamanho: 5 },
    { nome: 'mp1Peso', tipo: 'texto', tamanho: 11 },
    { nome: 'mp2Classe', tipo: 'texto', tamanho: 3 },
    { nome: 'mp2Item', tipo: 'numerico', tamanho: 5 },
    { nome: 'mp2Peso', tipo: 'texto', tamanho: 11 },
    { nome: 'mp3Classe', tipo: 'texto', tamanho: 3 },
    { nome: 'mp3Item', tipo: 'numerico', tamanho: 5 },
    { nome: 'mp3Peso', tipo: 'texto', tamanho: 11 },
    { nome: 'mp4Classe', tipo: 'texto', tamanho: 3 },
    { nome: 'mp4Item', tipo: 'numerico', tamanho: 5 },
    { nome: 'mp4Peso', tipo: 'texto', tamanho: 11 },
    { nome: 'mp5Classe', tipo: 'texto', tamanho: 3 },
    { nome: 'mp5Item', tipo: 'numerico', tamanho: 5 },
    { nome: 'mp5Peso', tipo: 'texto', tamanho: 11 },
    { nome: 'pesoBruto', tipo: 'texto', tamanho: 6 },
    { nome: 'pesoLiquido', tipo: 'texto', tamanho: 7 },
    { nome: 'qtdeOp', tipo: 'numerico', tamanho: 2 },
    { nome: 'producaoHr', tipo: 'numerico', tamanho: 9 },
    { nome: 'filler', tipo: 'texto', tamanho: 12 },
  ],
};
