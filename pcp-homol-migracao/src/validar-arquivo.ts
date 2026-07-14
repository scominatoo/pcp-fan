/**
 * Valida se o tamanho do layout bate com o arquivo .DAT real
 * Uso: npm run validar:arquivo -- PCPA28I.DAT 62
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import * as fs from 'fs';
import { caminhoLegado } from './parse-dat';

config({ path: resolve(__dirname, '../.env') });

const nomeArquivo = process.argv[2] ?? 'PCPA28I.DAT';
const tamanhoRegistro = parseInt(process.argv[3] ?? '62', 10);

const caminho = caminhoLegado(nomeArquivo);
const stat = fs.statSync(caminho);
const total = Math.floor(stat.size / tamanhoRegistro);
const resto = stat.size % tamanhoRegistro;

console.log(`Arquivo: ${caminho}`);
console.log(`Tamanho: ${stat.size} bytes`);
console.log(`Registro: ${tamanhoRegistro} bytes`);
console.log(`Registros estimados: ${total}`);
console.log(`Resto: ${resto} bytes`);

if (resto === 0) {
  console.log('✓ Tamanho do registro parece correto.');
} else {
  console.log('⚠ Resto ≠ 0 — revise o layout (tamanho do registro pode estar errado).');
}
