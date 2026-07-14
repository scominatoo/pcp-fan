/**
 * Migração — baixa de matéria-prima (PCPA76I + PCPA109I)
 *
 * Uso: npm run migrar:baixas-mp
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { Prisma, PrismaClient } from '@prisma/client';
import { caminhoLegado, parseRegistro } from './parse-dat';
import { LAYOUT_PCPA109I } from './layouts/pcpa109i';
import { LAYOUT_PCPA76I } from './layouts/pcpa76i';
import {
  INDEXED_PCPA109I,
  INDEXED_PCPA76I,
  lerRegistrosIndexados,
} from './ler-indexed-dat';
import { dataCobol, sanitizarTexto } from './migracao-utils';

config({ path: resolve(__dirname, '../.env') });

const prisma = new PrismaClient();

function parseQtde(inteiro: number, dec: number): number {
  if (!inteiro && !dec) return 0;
  return inteiro + dec / 100;
}

async function carregarMps(): Promise<Map<string, number>> {
  const mps = await prisma.materiaPrima.findMany({
    select: {
      id: true,
      classeLetra: true,
      classeNumero: true,
      itemCodigo: true,
    },
  });
  const map = new Map<string, number>();
  for (const mp of mps) {
    map.set(`${mp.classeLetra}|${mp.classeNumero}|${mp.itemCodigo}`, mp.id);
  }
  return map;
}

async function carregarOps(): Promise<Map<number, number>> {
  const ops = await prisma.ordemProducao.findMany({
    select: { id: true, codigo: true },
  });
  const map = new Map<number, number>();
  for (const op of ops) map.set(op.codigo, op.id);
  return map;
}

async function migrarMovimentos76(
  mpPorChave: Map<string, number>,
  opPorCodigo: Map<number, number>,
) {
  const caminho = caminhoLegado('PCPA76I.DAT');
  const registros = lerRegistrosIndexados(caminho, INDEXED_PCPA76I);

  console.log('Gravando movimentos MP (PCPA76I)...');
  await prisma.movimentoMateriaPrima.deleteMany({
    where: { origem: 'PCPA76I' },
  });

  let ok = 0;
  let ignorados = 0;
  const batch: Prisma.MovimentoMateriaPrimaCreateManyInput[] = [];

  for (const buf of registros) {
    const r = parseRegistro(buf, LAYOUT_PCPA76I);
    const tipo = sanitizarTexto(String(r.tipo));
    const classeLetra = sanitizarTexto(String(r.classeLetra));
    const classeNumero = (r.classeNumero as number) || 0;
    const itemCodigo = (r.itemCodigo as number) || 0;
    const loteNumero = (r.loteNumero as number) || 0;

    if (!tipo || !classeLetra || !itemCodigo) {
      ignorados++;
      continue;
    }

    const mpId =
      mpPorChave.get(`${classeLetra}|${classeNumero}|${itemCodigo}`) ?? null;

    batch.push({
      loteLetra: sanitizarTexto(String(r.loteLetra)),
      loteNumero,
      loteLetra2: sanitizarTexto(String(r.loteLetra2)),
      indice: (r.indice as number) || 0,
      tipo,
      dataMovimento: dataCobol(
        r.ano as number,
        r.mes as number,
        r.dia as number,
      ),
      nota: (r.nota as number) || null,
      materiaPrimaId: mpId,
      classeLetra,
      classeNumero,
      itemCodigo,
      qtdeRolos: (r.qtdeRolos as number) || 0,
      quantidade: parseQtde(r.qtdeInt as number, r.qtdeDec as number),
      flag: sanitizarTexto(String(r.flag)) || null,
      ordemProducaoId: null,
      origem: 'PCPA76I',
    });

    if (batch.length >= 500) {
      const result = await prisma.movimentoMateriaPrima.createMany({
        data: batch,
        skipDuplicates: true,
      });
      ok += result.count;
      batch.length = 0;
      if (ok % 1000 === 0) console.log(`  ... ${ok} movimentos`);
    }
  }

  if (batch.length > 0) {
    const result = await prisma.movimentoMateriaPrima.createMany({
      data: batch,
      skipDuplicates: true,
    });
    ok += result.count;
  }

  await prisma.migracaoLog.create({
    data: {
      arquivoOrigem: 'PCPA76I.DAT',
      registrosLidos: registros.length,
      registrosOk: ok,
      registrosErro: 0,
      mensagem: `${ignorados} ignorados (sem MP ou tipo inválido)`,
    },
  });

  console.log(`✓ Movimentos PCPA76I: ${ok} gravados, ${ignorados} ignorados`);
}

async function migrarBaixasOp109(
  mpPorChave: Map<string, number>,
  opPorCodigo: Map<number, number>,
) {
  const caminho = caminhoLegado('PCPA109I.DAT');
  const registros = lerRegistrosIndexados(caminho, INDEXED_PCPA109I);

  console.log('Gravando baixas MP por OP (PCPA109I)...');
  await prisma.ordemProducaoBaixaMateriaPrima.deleteMany({});
  await prisma.movimentoMateriaPrima.deleteMany({
    where: { origem: 'PCPA109I' },
  });

  let ok = 0;
  let ignorados = 0;

  for (const buf of registros) {
    const r = parseRegistro(buf, LAYOUT_PCPA109I);
    const codigoOp = (r.codigoOp as number) || 0;
    const classeLetra = sanitizarTexto(String(r.classeLetra));
    const classeNumero = (r.classeNumero as number) || 0;
    const itemCodigo = (r.itemCodigo as number) || 0;

    if (!codigoOp || !classeLetra || !itemCodigo) {
      ignorados++;
      continue;
    }

    const ordemProducaoId = opPorCodigo.get(codigoOp);
    const materiaPrimaId = mpPorChave.get(
      `${classeLetra}|${classeNumero}|${itemCodigo}`,
    );

    if (!ordemProducaoId || !materiaPrimaId) {
      ignorados++;
      continue;
    }

    const dataBaixa = dataCobol(
      r.ano as number,
      r.mes as number,
      r.dia as number,
    );
    const quantidade = parseQtde(r.qtdeInt as number, r.qtdeDec as number);

    await prisma.ordemProducaoBaixaMateriaPrima.create({
      data: {
        ordemProducaoId,
        materiaPrimaId,
        quantidade,
        qtdeRolos: (r.qtdeRolos as number) || 0,
        dataBaixa,
      },
    });

    await prisma.movimentoMateriaPrima.create({
      data: {
        loteLetra: '',
        loteNumero: 0,
        loteLetra2: '',
        indice: 0,
        tipo: 'B',
        dataMovimento: dataBaixa,
        nota: codigoOp,
        materiaPrimaId,
        classeLetra,
        classeNumero,
        itemCodigo,
        qtdeRolos: (r.qtdeRolos as number) || 0,
        quantidade,
        flag: sanitizarTexto(String(r.flag)) || null,
        ordemProducaoId,
        origem: 'PCPA109I',
      },
    });

    ok++;
  }

  await prisma.migracaoLog.create({
    data: {
      arquivoOrigem: 'PCPA109I.DAT',
      registrosLidos: registros.length,
      registrosOk: ok,
      registrosErro: 0,
      mensagem: `${ignorados} ignorados`,
    },
  });

  console.log(`✓ Baixas OP PCPA109I: ${ok} gravadas, ${ignorados} ignorados`);
}

async function main() {
  console.log('Migração de baixa de matéria-prima');
  console.log('Origem:', process.env.LEGACY_DATA_PATH);
  console.log('---');

  const mpPorChave = await carregarMps();
  const opPorCodigo = await carregarOps();
  console.log(`Lookup MPs: ${mpPorChave.size} | OPs: ${opPorCodigo.size}`);
  console.log('---');

  await migrarMovimentos76(mpPorChave, opPorCodigo);
  await migrarBaixasOp109(mpPorChave, opPorCodigo);

  console.log('---');
  console.log('Migração de baixa MP concluída.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
