/**
 * Migração — Pacote A: apoio à criação/emissão de OP
 *
 * Ordem (dependências do legado PC1028/PC1041):
 *   1. PCPA106I — desenhos do cliente (obrigatório na inclusão da OP)
 *   2. PCPA69I  — seções (descrição no roteiro / emissão)
 *   3. PCPA64I  — equipamentos (descrição na emissão)
 *
 * Uso: npm run migrar:apoio-op
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { PrismaClient } from '@prisma/client';
import { caminhoLegado, parseRegistro } from './parse-dat';
import { LAYOUT_PCPA106I } from './layouts/pcpa106i';
import { LAYOUT_PCPA69I } from './layouts/pcpa69i';
import { LAYOUT_PCPA64I } from './layouts/pcpa64i';
import {
  INDEXED_PCPA106I,
  INDEXED_PCPA69I,
  INDEXED_PCPA64I,
  lerRegistrosIndexados,
} from './ler-indexed-dat';
import { sanitizarTexto } from './migracao-utils';

config({ path: resolve(__dirname, '../.env') });

const prisma = new PrismaClient();

/**
 * Converte PIC S9(06)V999 (9 bytes DISPLAY) em string decimal.
 * Aceita overpunch COBOL no último dígito ({=0+, A=1+ … } =0-, J=1- …).
 */
function parseQtdeEstoque(raw: string): string | null {
  if (!raw?.trim()) return null;

  const OVERPUNCH: Record<string, { digito: string; negativo: boolean }> = {
    '{': { digito: '0', negativo: false },
    '}': { digito: '0', negativo: true },
    A: { digito: '1', negativo: false },
    J: { digito: '1', negativo: true },
    B: { digito: '2', negativo: false },
    K: { digito: '2', negativo: true },
    C: { digito: '3', negativo: false },
    L: { digito: '3', negativo: true },
    D: { digito: '4', negativo: false },
    M: { digito: '4', negativo: true },
    E: { digito: '5', negativo: false },
    N: { digito: '5', negativo: true },
    F: { digito: '6', negativo: false },
    O: { digito: '6', negativo: true },
    G: { digito: '7', negativo: false },
    P: { digito: '7', negativo: true },
    H: { digito: '8', negativo: false },
    Q: { digito: '8', negativo: true },
    I: { digito: '9', negativo: false },
    R: { digito: '9', negativo: true },
  };

  let negativo = false;
  let chars = raw.trim();
  const ultimo = chars.slice(-1);
  const map = OVERPUNCH[ultimo];
  if (map) {
    chars = chars.slice(0, -1) + map.digito;
    negativo = map.negativo;
  }

  const digitos = chars.replace(/\D/g, '');
  if (!digitos || /^0+$/.test(digitos)) return '0.000';

  const padded = digitos.padStart(9, '0');
  const intPart = padded.slice(0, -3) || '0';
  const decPart = padded.slice(-3);
  const valor = `${negativo ? '-' : ''}${parseInt(intPart, 10)}.${decPart}`;
  return valor;
}

async function migrarDesenhos() {
  const caminho = caminhoLegado('PCPA106I.DAT');
  const registros = lerRegistrosIndexados(caminho, INDEXED_PCPA106I);

  let ok = 0;
  let ignorados = 0;
  let erros = 0;

  console.log('Gravando desenhos (PCPA106I)...');

  for (const buf of registros) {
    const r = parseRegistro(buf, LAYOUT_PCPA106I);
    const desenhoCliente = sanitizarTexto(String(r.desenhoCliente));

    // Slot vazio ou chave inválida — pula
    if (!desenhoCliente || desenhoCliente.length < 2) {
      ignorados++;
      continue;
    }

    const descricao = sanitizarTexto(String(r.descricao)) || null;
    const unidade = sanitizarTexto(String(r.unidade)) || null;
    const qtdeEstoque = parseQtdeEstoque(String(r.qtdeEstoque));

    try {
      await prisma.desenhoCliente.upsert({
        where: { desenhoCliente },
        create: {
          desenhoCliente,
          descricao,
          unidade,
          qtdeEstoque,
        },
        update: {
          descricao,
          unidade,
          qtdeEstoque,
        },
      });
      ok++;
    } catch (e) {
      erros++;
      if (erros <= 5) {
        console.error('Erro desenho:', desenhoCliente, e);
      }
    }
  }

  await prisma.migracaoLog.create({
    data: {
      arquivoOrigem: 'PCPA106I.DAT',
      registrosLidos: registros.length,
      registrosOk: ok,
      registrosErro: erros,
      mensagem: `${ignorados} registros vazios/inválidos ignorados`,
    },
  });

  console.log(
    `✓ Desenhos: ${ok} gravados, ${erros} erros, ${ignorados} ignorados (${registros.length} lidos)`,
  );
}

async function migrarSecoes() {
  const caminho = caminhoLegado('PCPA69I.DAT');
  const registros = lerRegistrosIndexados(caminho, INDEXED_PCPA69I);

  let ok = 0;
  let ignorados = 0;
  let erros = 0;

  console.log('Gravando seções (PCPA69I)...');

  for (const buf of registros) {
    const r = parseRegistro(buf, LAYOUT_PCPA69I);
    const codigo = r.codigo as number;

    if (!codigo) {
      ignorados++;
      continue;
    }

    const descricao = sanitizarTexto(String(r.descricao)) || null;
    const responsavel1 = sanitizarTexto(String(r.responsavel1)) || null;
    const responsavel2 = sanitizarTexto(String(r.responsavel2)) || null;

    try {
      await prisma.secao.upsert({
        where: { codigo },
        create: { codigo, descricao, responsavel1, responsavel2 },
        update: { descricao, responsavel1, responsavel2 },
      });
      ok++;
    } catch (e) {
      erros++;
      if (erros <= 3) console.error('Erro seção:', codigo, e);
    }
  }

  await prisma.migracaoLog.create({
    data: {
      arquivoOrigem: 'PCPA69I.DAT',
      registrosLidos: registros.length,
      registrosOk: ok,
      registrosErro: erros,
      mensagem: `${ignorados} slots vazios ignorados`,
    },
  });

  console.log(
    `✓ Seções: ${ok} gravadas, ${erros} erros, ${ignorados} ignorados (${registros.length} lidos)`,
  );
}

async function migrarEquipamentos() {
  const caminho = caminhoLegado('PCPA64I.DAT');
  const registros = lerRegistrosIndexados(caminho, INDEXED_PCPA64I);

  let ok = 0;
  let ignorados = 0;
  let erros = 0;

  console.log('Gravando equipamentos (PCPA64I)...');

  for (const buf of registros) {
    const r = parseRegistro(buf, LAYOUT_PCPA64I);
    const grupoCodigo = r.grupoCodigo as number;
    const codigo = r.codigo as number;
    const descricao = sanitizarTexto(String(r.descricao)) || null;

    // Sem grupo e sem descrição útil = ruído do arquivo indexado
    if (!grupoCodigo && !codigo && !descricao) {
      ignorados++;
      continue;
    }
    if (!descricao) {
      ignorados++;
      continue;
    }

    const modelo = sanitizarTexto(String(r.modelo)) || null;
    const marca = sanitizarTexto(String(r.marca)) || null;

    try {
      await prisma.equipamento.upsert({
        where: {
          grupoCodigo_codigo: { grupoCodigo, codigo },
        },
        create: {
          grupoCodigo,
          codigo,
          descricao,
          modelo,
          marca,
        },
        update: {
          descricao,
          modelo,
          marca,
        },
      });
      ok++;
    } catch (e) {
      erros++;
      if (erros <= 3) {
        console.error('Erro equipamento:', grupoCodigo, codigo, e);
      }
    }
  }

  await prisma.migracaoLog.create({
    data: {
      arquivoOrigem: 'PCPA64I.DAT',
      registrosLidos: registros.length,
      registrosOk: ok,
      registrosErro: erros,
      mensagem: `${ignorados} registros sem descrição ignorados`,
    },
  });

  console.log(
    `✓ Equipamentos: ${ok} gravados, ${erros} erros, ${ignorados} ignorados (${registros.length} lidos)`,
  );
}

async function main() {
  console.log('Migração Pacote A — apoio OP (desenho, seção, equipamento)');
  console.log('Origem:', process.env.LEGACY_DATA_PATH);
  console.log('---');

  // Ordem alinhada às validações do legado na inclusão/emissão de OP
  await migrarDesenhos();
  await migrarSecoes();
  await migrarEquipamentos();

  console.log('---');
  console.log('Pacote A concluído.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
