/**
 * Migração — baixas de OP (PCPA71I + PCPA132I)
 *
 * Uso: npm run migrar:baixas
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { Prisma, PrismaClient } from '@prisma/client';
import { caminhoLegado, parseRegistro } from './parse-dat';
import { LAYOUT_PCPA71I } from './layouts/pcpa71i';
import { LAYOUT_PCPA132I } from './layouts/pcpa132i';
import {
  INDEXED_PCPA132I,
  INDEXED_PCPA71I,
  lerRegistrosIndexados,
} from './ler-indexed-dat';
import { dataCobol, horaCobol, sanitizarTexto } from './migracao-utils';

config({ path: resolve(__dirname, '../.env') });

const prisma = new PrismaClient();

function parsePeso(inteiro: number, dec: number): number | null {
  if (!inteiro && !dec) return null;
  return inteiro + dec / 100;
}

function parseTempos71i(raw: string) {
  const tempos: Array<{ prepMin: number; prodMin: number }> = [];
  for (let i = 0; i < 25; i++) {
    const chunk = raw.slice(i * 10, i * 10 + 10);
    const prepHh = parseInt(chunk.slice(0, 3), 10) || 0;
    const prepMm = parseInt(chunk.slice(3, 5), 10) || 0;
    const prodHh = parseInt(chunk.slice(5, 8), 10) || 0;
    const prodMm = parseInt(chunk.slice(8, 10), 10) || 0;
    tempos.push({
      prepMin: prepHh * 60 + prepMm,
      prodMin: prodHh * 60 + prodMm,
    });
  }
  return tempos;
}

async function carregarOps(): Promise<Map<number, number>> {
  const ops = await prisma.ordemProducao.findMany({
    select: { id: true, codigo: true },
  });
  const map = new Map<number, number>();
  for (const op of ops) map.set(op.codigo, op.id);
  return map;
}

async function migrarBaixaConsolidada(opPorCodigo: Map<number, number>) {
  const caminho = caminhoLegado('PCPA71I.DAT');
  const registros = lerRegistrosIndexados(caminho, INDEXED_PCPA71I);

  console.log('Gravando baixas consolidadas (PCPA71I)...');
  await prisma.ordemProducaoBaixaConsolidada.deleteMany({});

  let ok = 0;
  let ignorados = 0;
  const batch: Prisma.OrdemProducaoBaixaConsolidadaCreateManyInput[] = [];

  for (const buf of registros) {
    const r = parseRegistro(buf, LAYOUT_PCPA71I);
    const codigoOp = r.codigoOp as number;
    if (!codigoOp) {
      ignorados++;
      continue;
    }

    const ordemProducaoId = opPorCodigo.get(codigoOp);
    if (!ordemProducaoId) {
      ignorados++;
      continue;
    }

    const dataBaixa = dataCobol(
      r.anoBaixa as number,
      r.mesBaixa as number,
      r.diaBaixa as number,
    );
    const horaBaixa = horaCobol(
      r.horaBaixaHh as number,
      r.horaBaixaMm as number,
      0,
    );

    batch.push({
      ordemProducaoId,
      dataBaixa,
      horaBaixa: horaBaixa?.slice(0, 5) ?? null,
      pecasProduzidas: (r.pecasProduzidas as number) || 0,
      mpConsumida: (r.mpConsumida as number) || 0,
      rolos: (r.rolos as number) || 0,
      temposOperacoes: parseTempos71i(String(r.temposRaw)),
      turno1: (r.turno1 as number) || 0,
      turno2: (r.turno2 as number) || 0,
    });

    if (batch.length >= 500) {
      const result = await prisma.ordemProducaoBaixaConsolidada.createMany({
        data: batch,
        skipDuplicates: true,
      });
      ok += result.count;
      batch.length = 0;
      if (ok % 5000 === 0) console.log(`  ... ${ok} consolidadas`);
    }
  }

  if (batch.length > 0) {
    const result = await prisma.ordemProducaoBaixaConsolidada.createMany({
      data: batch,
      skipDuplicates: true,
    });
    ok += result.count;
  }

  await prisma.migracaoLog.create({
    data: {
      arquivoOrigem: 'PCPA71I.DAT',
      registrosLidos: registros.length,
      registrosOk: ok,
      registrosErro: 0,
      mensagem: `${ignorados} ignorados (sem OP pai ou vazio)`,
    },
  });

  console.log(`✓ Baixas consolidadas: ${ok} gravadas, ${ignorados} ignorados`);
}

async function migrarBaixaOperacoes(opPorCodigo: Map<number, number>) {
  const caminho = caminhoLegado('PCPA132I.DAT');
  const registros = lerRegistrosIndexados(caminho, INDEXED_PCPA132I);

  console.log('Gravando baixas por operação (PCPA132I)...');
  await prisma.ordemProducaoBaixaOperacao.deleteMany({});

  let ok = 0;
  let ignorados = 0;
  const batch: Prisma.OrdemProducaoBaixaOperacaoCreateManyInput[] = [];

  for (const buf of registros) {
    const r = parseRegistro(buf, LAYOUT_PCPA132I);
    const codigoOp = r.codigoOp as number;
    const numeroOperacao = r.numeroOperacao as number;

    if (!codigoOp || !numeroOperacao) {
      ignorados++;
      continue;
    }

    const ordemProducaoId = opPorCodigo.get(codigoOp);
    if (!ordemProducaoId) {
      ignorados++;
      continue;
    }

    batch.push({
      ordemProducaoId,
      numeroOperacao,
      dataLancamento: dataCobol(
        r.anoLcto as number,
        r.mesLcto as number,
        r.diaLcto as number,
      ),
      dataInicio: dataCobol(
        r.anoIni as number,
        r.mesIni as number,
        r.diaIni as number,
      ),
      horaInicio: horaCobol(
        r.horaIniHh as number,
        r.horaIniMm as number,
        r.horaIniSs as number,
      ),
      dataFim: dataCobol(
        r.anoFim as number,
        r.mesFim as number,
        r.diaFim as number,
      ),
      horaFim: horaCobol(
        r.horaFimHh as number,
        r.horaFimMm as number,
        r.horaFimSs as number,
      ),
      diasTotal: (r.diasTotal as number) || null,
      tempoTotalHoras: (r.tempoTotalHh as number) || null,
      tempoTotalMinutos: (r.tempoTotalMm as number) || null,
      tempoTotalSegundos: (r.tempoTotalSs as number) || null,
      equipamentoGrupo: (r.equipamentoGrupo as number) || null,
      equipamentoCodigo: (r.equipamentoCodigo as number) || null,
      qtdeSaida: (r.qtdeSaida as number) || 0,
      pesoSaida: parsePeso(
        r.pesoSaidaInt as number,
        r.pesoSaidaDec as number,
      ),
      dataSaida: dataCobol(
        r.anoSaida as number,
        r.mesSaida as number,
        r.diaSaida as number,
      ),
      qtdeEntrada: (r.qtdeEntrada as number) || 0,
      pesoEntrada: parsePeso(
        r.pesoEntradaInt as number,
        r.pesoEntradaDec as number,
      ),
      dataEntrada: dataCobol(
        r.anoEntrada as number,
        r.mesEntrada as number,
        r.diaEntrada as number,
      ),
      diferQtde: (r.diferQtde as number) || null,
      diferPeso: parsePeso(
        r.diferPesoInt as number,
        r.diferPesoDec as number,
      ),
      diferTempo: (r.diferTempo as number) || null,
      atualizouEstoque: sanitizarTexto(String(r.atualizouEstoque)) === 'S',
    });

    if (batch.length >= 1000) {
      const result = await prisma.ordemProducaoBaixaOperacao.createMany({
        data: batch,
        skipDuplicates: true,
      });
      ok += result.count;
      batch.length = 0;
      if (ok % 10000 === 0) console.log(`  ... ${ok} baixas operação`);
    }
  }

  if (batch.length > 0) {
    const result = await prisma.ordemProducaoBaixaOperacao.createMany({
      data: batch,
      skipDuplicates: true,
    });
    ok += result.count;
  }

  await prisma.migracaoLog.create({
    data: {
      arquivoOrigem: 'PCPA132I.DAT',
      registrosLidos: registros.length,
      registrosOk: ok,
      registrosErro: 0,
      mensagem: `${ignorados} ignorados`,
    },
  });

  console.log(`✓ Baixas por operação: ${ok} gravadas, ${ignorados} ignorados`);
}

async function main() {
  console.log('Migração de baixas de OP');
  console.log('Origem:', process.env.LEGACY_DATA_PATH);
  console.log('---');

  const opPorCodigo = await carregarOps();
  console.log(`Lookup OPs: ${opPorCodigo.size}`);
  console.log('---');

  await migrarBaixaConsolidada(opPorCodigo);
  await migrarBaixaOperacoes(opPorCodigo);

  console.log('---');
  console.log('Migração de baixas concluída.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
