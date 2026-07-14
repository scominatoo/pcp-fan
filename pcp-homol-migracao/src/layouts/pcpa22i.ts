/**
 * Layout PCPA22I.DAT — matéria-prima (POWPRIMA.COB / PC1022.COB)
 * Tamanho do registro lógico: 391 bytes (FD REG-PRIMA)
 * Passo físico no arquivo indexado: 396 bytes (ver ler-indexed-dat.ts)
 */

import type { LayoutRegistro } from '../parse-dat';

export const LAYOUT_PCPA22I: LayoutRegistro = {
  nomeArquivo: 'PCPA22I.DAT',
  tamanhoRegistro: 391,
  campos: [
    { nome: 'classeLetra', tipo: 'texto', tamanho: 1 },
    { nome: 'classeNumero', tipo: 'numerico', tamanho: 2 },
    { nome: 'item', tipo: 'numerico', tamanho: 5 },
    { nome: 'descricao', tipo: 'texto', tamanho: 40 },
    { nome: 'unidade', tipo: 'texto', tamanho: 3 },
    { nome: 'espessura', tipo: 'numerico', tamanho: 5 },
    { nome: 'previsao', tipo: 'numerico', tamanho: 5 },
    { nome: 'comprimento', tipo: 'numerico', tamanho: 5 },
    { nome: 'qualidade', tipo: 'texto', tamanho: 10 },
    { nome: 'dureza', tipo: 'texto', tamanho: 10 },
    { nome: 'quantidade', tipo: 'numerico', tamanho: 11 },
    { nome: 'estoqueMin', tipo: 'numerico', tamanho: 8 },
    { nome: 'estoqueMax', tipo: 'numerico', tamanho: 8 },
    { nome: 'anoEnt', tipo: 'numerico', tamanho: 4 },
    { nome: 'mesEnt', tipo: 'numerico', tamanho: 2 },
    { nome: 'diaEnt', tipo: 'numerico', tamanho: 2 },
    { nome: 'anoSai', tipo: 'numerico', tamanho: 4 },
    { nome: 'mesSai', tipo: 'numerico', tamanho: 2 },
    { nome: 'diaSai', tipo: 'numerico', tamanho: 2 },
    // MP-PECA OCCURS 20 — armazenado como filler (não migrado na Fase 0)
    { nome: 'pecasOcorrencias', tipo: 'texto', tamanho: 200 },
    // MP-FORNECEDOR OCCURS 5
    { nome: 'fornecedores', tipo: 'texto', tamanho: 25 },
    { nome: 'qtdeRolos', tipo: 'numerico', tamanho: 2 },
    { nome: 'pesoBruto', tipo: 'numerico', tamanho: 7 },
    { nome: 'largura', tipo: 'numerico', tamanho: 8 },
    { nome: 'espesMa', tipo: 'numerico', tamanho: 3 },
    { nome: 'espesMe', tipo: 'numerico', tamanho: 3 },
    { nome: 'largMa', tipo: 'numerico', tamanho: 3 },
    { nome: 'largMe', tipo: 'numerico', tamanho: 3 },
    { nome: 'ipi', tipo: 'numerico', tamanho: 4 },
    { nome: 'classeFiscal', tipo: 'texto', tamanho: 2 },
    { nome: 'filler', tipo: 'texto', tamanho: 2 },
  ],
};
