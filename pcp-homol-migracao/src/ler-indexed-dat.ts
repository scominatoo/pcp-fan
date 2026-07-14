/**
 * Leitura de arquivos .DAT indexados do Micro Focus COBOL.
 *
 * Arquivos INDEXED não são sequenciais puros: cada registro lógico ocupa
 * um "passo físico" maior no arquivo (overhead de ~5 bytes por registro).
 * O primeiro registro começa após um cabeçalho fixo (offset inicial).
 *
 * Calibração feita em 09/07/2026 contra PCPA18I.DAT e PCPA22I.DAT.
 */

import * as fs from 'fs';

/** Parâmetros de leitura de um arquivo .DAT indexado calibrado. */
export type ConfigArquivoIndexed = {
  /** Nome para logs (ex.: PCPA18I.DAT) */
  nomeArquivo: string;
  /** Bytes ignorados no início do arquivo (cabeçalho Micro Focus) */
  offsetInicial: number;
  /** Distância em bytes entre o início de cada registro físico */
  passoFisico: number;
  /** Tamanho do registro lógico (FD COBOL) a extrair de cada posição */
  tamanhoLogico: number;
  /** Bytes de índice Micro Focus no início de cada registro lógico (ex.: PCPA70XI) */
  skipIndiceBytes?: number;
};

/**
 * Configurações calibradas — ver docs/06-migracao-dados-legados.md
 */
export const INDEXED_PCPA18I: ConfigArquivoIndexed = {
  nomeArquivo: 'PCPA18I.DAT',
  offsetInicial: 130,
  passoFisico: 292,
  tamanhoLogico: 287,
};

export const INDEXED_PCPA22I: ConfigArquivoIndexed = {
  nomeArquivo: 'PCPA22I.DAT',
  offsetInicial: 130,
  passoFisico: 396,
  tamanhoLogico: 391,
};

/** Grupos de produtos — carregar antes de PCPA18I (FK) */
export const INDEXED_PCPA19I: ConfigArquivoIndexed = {
  nomeArquivo: 'PCPA19I.DAT',
  offsetInicial: 130,
  passoFisico: 104,
  tamanhoLogico: 101,
};

/** Classificações de produtos — carregar antes de PCPA18I (FK) */
export const INDEXED_PCPA20I: ConfigArquivoIndexed = {
  nomeArquivo: 'PCPA20I.DAT',
  offsetInicial: 130,
  passoFisico: 104,
  tamanhoLogico: 100,
};

/** OP — cabeçalho (PC1028 / PC1041) */
export const INDEXED_PCPA28I: ConfigArquivoIndexed = {
  nomeArquivo: 'PCPA28I.DAT',
  offsetInicial: 130,
  passoFisico: 64,
  tamanhoLogico: 62,
};

/** OP — complemento cliente */
export const INDEXED_PCPA28II: ConfigArquivoIndexed = {
  nomeArquivo: 'PCPA28II.DAT',
  offsetInicial: 130,
  passoFisico: 172,
  tamanhoLogico: 168,
};

/** OP — operações (calibrado 09/07/2026: passo 76 = 74 lógico + 2 overhead) */
export const INDEXED_PCPA28E: ConfigArquivoIndexed = {
  nomeArquivo: 'PCPA28E.DAT',
  offsetInicial: 130,
  passoFisico: 76,
  tamanhoLogico: 74,
};

/** OP — baixa consolidada (PC1028 / PCPA71I) */
export const INDEXED_PCPA71I: ConfigArquivoIndexed = {
  nomeArquivo: 'PCPA71I.DAT',
  offsetInicial: 130,
  passoFisico: 312,
  tamanhoLogico: 310,
};

/** OP — baixa por operação (PC1132 / PCPA132I) */
export const INDEXED_PCPA132I: ConfigArquivoIndexed = {
  nomeArquivo: 'PCPA132I.DAT',
  offsetInicial: 130,
  passoFisico: 204,
  tamanhoLogico: 194,
};

/** Movimento MP — PC1076 / PCPA76I (calibrado 10/07/2026) */
export const INDEXED_PCPA76I: ConfigArquivoIndexed = {
  nomeArquivo: 'PCPA76I.DAT',
  offsetInicial: 130,
  passoFisico: 76,
  tamanhoLogico: 66,
};

/** Baixa MP por OP — PC1109 / PCPA109I */
export const INDEXED_PCPA109I: ConfigArquivoIndexed = {
  nomeArquivo: 'PCPA109I.DAT',
  offsetInicial: 130,
  passoFisico: 54,
  tamanhoLogico: 54,
};

/** Programação de entregas — PC1066 / PCPA66I (calibrado 10/07/2026) */
export const INDEXED_PCPA66I: ConfigArquivoIndexed = {
  nomeArquivo: 'PCPA66I.DAT',
  offsetInicial: 130,
  passoFisico: 108,
  tamanhoLogico: 105,
};

/** Processo produtivo — cabeçalho */
export const INDEXED_PCPA70I: ConfigArquivoIndexed = {
  nomeArquivo: 'PCPA70I.DAT',
  offsetInicial: 130,
  passoFisico: 150,
  tamanhoLogico: 146,
};

/** Processo produtivo — roteiro de operações */
export const INDEXED_PCPA70XI: ConfigArquivoIndexed = {
  nomeArquivo: 'PCPA70XI.DAT',
  offsetInicial: 128,
  passoFisico: 672,
  tamanhoLogico: 668,
  skipIndiceBytes: 2,
};

/**
 * Lê registros lógicos de um arquivo .DAT indexado Micro Focus.
 * Retorna um buffer por registro, já cortado no tamanho lógico do FD.
 */
export function lerRegistrosIndexados(
  caminhoArquivo: string,
  config: ConfigArquivoIndexed,
): Buffer[] {
  const conteudo = fs.readFileSync(caminhoArquivo);
  const registros: Buffer[] = [];

  for (
    let offset = config.offsetInicial;
    offset + config.tamanhoLogico <= conteudo.length;
    offset += config.passoFisico
  ) {
    const inicioLogico = offset + (config.skipIndiceBytes ?? 0);
    const fimLogico = inicioLogico + config.tamanhoLogico;
    if (fimLogico > conteudo.length) break;
    registros.push(conteudo.subarray(inicioLogico, fimLogico));
  }

  const bytesRestantes =
    conteudo.length -
    config.offsetInicial -
    registros.length * config.passoFisico;

  if (bytesRestantes > 0) {
    console.warn(
      `⚠ ${config.nomeArquivo}: ${bytesRestantes} bytes não utilizados no final do arquivo`,
    );
  }

  console.log(
    `  ${config.nomeArquivo}: ${registros.length} registros (passo=${config.passoFisico}, lógico=${config.tamanhoLogico})`,
  );

  return registros;
}
