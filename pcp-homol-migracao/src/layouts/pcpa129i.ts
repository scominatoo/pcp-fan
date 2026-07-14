/**
 * Layout PCPA129I.DAT — ferramentas / dispositivos (PC1128 / PC1129)
 *
 * Registro lógico (FD REG-FERRAMENTA): 606 bytes
 * Passo físico indexado: 608 | offset: 130
 *
 * Tabelas FR-TAB-20 e FR-TAB-16 são lidas como blocos e parseadas no script.
 */

import type { LayoutRegistro } from '../parse-dat';

export const LAYOUT_PCPA129I: LayoutRegistro = {
  nomeArquivo: 'PCPA129I.DAT',
  tamanhoRegistro: 606,
  campos: [
    { nome: 'fabrica', tipo: 'texto', tamanho: 1 },
    { nome: 'numero', tipo: 'texto', tamanho: 15 },
    { nome: 'matricula', tipo: 'numerico', tamanho: 2 },
    { nome: 'cavidade', tipo: 'numerico', tamanho: 2 },
    { nome: 'sufixo', tipo: 'texto', tamanho: 10 },
    { nome: 'descricao', tipo: 'texto', tamanho: 30 },
    { nome: 'checkList', tipo: 'texto', tamanho: 10 },
    // FR-TAB-20: 20 × 8 = 160
    { nome: 'tabMp', tipo: 'texto', tamanho: 160 },
    // FR-TAB-16: 16 × 20 = 320
    { nome: 'tabRel', tipo: 'texto', tamanho: 320 },
    { nome: 'limiteAfiacao', tipo: 'numerico', tamanho: 7 },
    { nome: 'acumGolpes', tipo: 'numerico', tamanho: 8 },
    { nome: 'anoIni', tipo: 'numerico', tamanho: 4 },
    { nome: 'mesIni', tipo: 'numerico', tamanho: 2 },
    { nome: 'diaIni', tipo: 'numerico', tamanho: 2 },
    { nome: 'anoFin', tipo: 'numerico', tamanho: 4 },
    { nome: 'mesFin', tipo: 'numerico', tamanho: 2 },
    { nome: 'diaFin', tipo: 'numerico', tamanho: 2 },
    { nome: 'plContNr', tipo: 'numerico', tamanho: 8 },
    // PC1129: FR-TIPO(1) + FILLER(16) — ou FILLER(17) no PC1070
    { nome: 'fillerFinal', tipo: 'texto', tamanho: 17 },
  ],
};
