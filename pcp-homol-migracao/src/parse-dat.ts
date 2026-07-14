/**
 * Utilitários para leitura de arquivos .DAT do COBOL (registro de tamanho fixo).
 * Os arquivos legados usam ISO-8859-1 (Latin-1) na prática — encoding comum em DOS.
 */

import * as fs from 'fs';

export type CampoLayout = {
  nome: string;
  tamanho: number;
  tipo: 'texto' | 'numerico';
};

export type LayoutRegistro = {
  nomeArquivo: string;
  tamanhoRegistro: number;
  campos: CampoLayout[];
};

/** Soma o tamanho de todos os campos e valida contra o tamanho esperado do registro. */
export function validarLayout(layout: LayoutRegistro): void {
  const soma = layout.campos.reduce((acc, c) => acc + c.tamanho, 0);
  if (soma !== layout.tamanhoRegistro) {
    throw new Error(
      `Layout ${layout.nomeArquivo}: soma dos campos (${soma}) ≠ tamanho do registro (${layout.tamanhoRegistro})`,
    );
  }
}

/**
 * Lê um arquivo .DAT inteiro e devolve um array de buffers, um por registro.
 * Ignora bytes extras no final se o arquivo não for múltiplo exato (com aviso).
 */
export function lerRegistrosFixos(
  caminhoArquivo: string,
  tamanhoRegistro: number,
): Buffer[] {
  const conteudo = fs.readFileSync(caminhoArquivo);
  const registros: Buffer[] = [];
  const total = Math.floor(conteudo.length / tamanhoRegistro);
  const resto = conteudo.length % tamanhoRegistro;

  if (resto > 0) {
    console.warn(
      `⚠ ${caminhoArquivo}: ${resto} bytes extras no final (ignorados)`,
    );
  }

  for (let i = 0; i < total; i++) {
    const inicio = i * tamanhoRegistro;
    registros.push(conteudo.subarray(inicio, inicio + tamanhoRegistro));
  }

  return registros;
}

/** Extrai um campo texto do buffer na posição indicada. */
export function lerTexto(buffer: Buffer, offset: number, tamanho: number): string {
  return buffer.toString('latin1', offset, offset + tamanho).trim();
}

/** Extrai número inteiro de campo numérico COBOL (PIC 9), ignorando espaços. */
export function lerNumerico(buffer: Buffer, offset: number, tamanho: number): number {
  const raw = buffer.toString('latin1', offset, offset + tamanho).replace(/\s/g, '');
  if (!raw) return 0;
  const n = parseInt(raw, 10);
  return Number.isNaN(n) ? 0 : n;
}

/** Monta objeto com os campos do layout a partir de um buffer de registro. */
export function parseRegistro(
  buffer: Buffer,
  layout: LayoutRegistro,
): Record<string, string | number> {
  const resultado: Record<string, string | number> = {};
  let offset = 0;

  for (const campo of layout.campos) {
    if (campo.tipo === 'texto') {
      resultado[campo.nome] = lerTexto(buffer, offset, campo.tamanho);
    } else {
      resultado[campo.nome] = lerNumerico(buffer, offset, campo.tamanho);
    }
    offset += campo.tamanho;
  }

  return resultado;
}

/** Resolve caminho do arquivo legado a partir de LEGACY_DATA_PATH no .env */
export function caminhoLegado(nomeArquivo: string): string {
  const base =
    process.env.LEGACY_DATA_PATH ?? '/Users/scominato/FANANDRI';
  const path = require('path') as typeof import('path');
  return path.join(base, nomeArquivo);
}
