/**
 * Valida calibração de arquivos .DAT indexados Micro Focus.
 * Uso: npm run validar:indexed -- PCPA28E
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import * as fs from 'fs';
import { caminhoLegado, parseRegistro } from './parse-dat';
import { LAYOUT_PCPA18I } from './layouts/pcpa18i';
import { LAYOUT_PCPA22I } from './layouts/pcpa22i';
import { LAYOUT_PCPA28E } from './layouts/pcpa28e';
import {
  ConfigArquivoIndexed,
  INDEXED_PCPA18I,
  INDEXED_PCPA22I,
  INDEXED_PCPA28E,
  lerRegistrosIndexados,
} from './ler-indexed-dat';
import type { LayoutRegistro } from './parse-dat';

config({ path: resolve(__dirname, '../.env') });

const ALIAS: Record<string, ConfigArquivoIndexed> = {
  PCPA18I: INDEXED_PCPA18I,
  PCPA22I: INDEXED_PCPA22I,
  PCPA28E: INDEXED_PCPA28E,
};

const LAYOUT: Record<string, LayoutRegistro> = {
  PCPA18I: LAYOUT_PCPA18I,
  PCPA22I: LAYOUT_PCPA22I,
  PCPA28E: LAYOUT_PCPA28E,
};

const arg = (process.argv[2] ?? 'PCPA18I').toUpperCase().replace('.DAT', '');
const cfg = ALIAS[arg];
const layout = LAYOUT[arg];

if (!cfg || !layout) {
  console.error(
    `Arquivo desconhecido: ${arg}. Use PCPA18I, PCPA22I ou PCPA28E.`,
  );
  process.exit(1);
}

const caminho = caminhoLegado(cfg.nomeArquivo);
const stat = fs.statSync(caminho);

console.log(`Arquivo: ${caminho}`);
console.log(`Tamanho: ${stat.size} bytes`);
console.log(`Offset inicial: ${cfg.offsetInicial}`);
console.log(`Passo físico: ${cfg.passoFisico}`);
console.log(`Tamanho lógico: ${cfg.tamanhoLogico}`);
console.log('---');

const registros = lerRegistrosIndexados(caminho, cfg);

let validos = 0;
let vazios = 0;

for (const buf of registros) {
  const r = parseRegistro(buf, layout);
  if (arg === 'PCPA18I') {
    const grupo = r.grupo as number;
    const item = r.item as number;
    if (grupo === 0 && item === 0) vazios++;
    else if (String(r.descricao).trim()) validos++;
  } else if (arg === 'PCPA22I') {
    const item = r.item as number;
    const letra = String(r.classeLetra).trim();
    if (!letra && item === 0) vazios++;
    else if (String(r.descricao).trim()) validos++;
  } else if (arg === 'PCPA28E') {
    const codigoOp = r.codigoOp as number;
    const numeroOperacao = r.numeroOperacao as number;
    if (codigoOp === 0 || numeroOperacao === 0) vazios++;
    else if (numeroOperacao > 0 && numeroOperacao <= 25) validos++;
  }
}

console.log(`Registros lidos: ${registros.length}`);
console.log(`Com dados: ${validos}`);
console.log(`Slots vazios: ${vazios}`);

if (registros.length > 0) {
  const amostra = parseRegistro(registros[0], layout);
  console.log('Primeiro registro:', amostra);
}

console.log('✓ Validação indexed concluída.');
