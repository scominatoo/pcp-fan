/**
 * Migração — Pacote D: compras, NRMP e saldo planejamento
 *
 *   1. PCPA41I  — pedidos de compra (~85k)
 *   2. PCPA41II — pedidos MP em aberto (~83k)
 *   3. PCPA73I  — NRMP
 *   4. PCPA73II — consulta NRMP (mínimo)
 *   5. PCPA68I  — saldo planejamento
 *
 * Uso: npm run migrar:pacote-d
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { Prisma, PrismaClient } from '@prisma/client';
import { caminhoLegado, parseRegistro, validarLayout } from './parse-dat';
import {
  LAYOUT_PCPA41I,
  PCPA41I_ITENS_OFFSET,
  PCPA41I_ITEM_SIZE,
  PCPA41I_OP_OFFSET,
} from './layouts/pcpa41i';
import { LAYOUT_PCPA41II } from './layouts/pcpa41ii';
import { LAYOUT_PCPA73I } from './layouts/pcpa73i';
import { LAYOUT_PCPA73II } from './layouts/pcpa73ii';
import { LAYOUT_PCPA68I } from './layouts/pcpa68i';
import {
  INDEXED_PCPA41I,
  INDEXED_PCPA41II,
  INDEXED_PCPA73I,
  INDEXED_PCPA73II,
  INDEXED_PCPA68I,
  lerRegistrosIndexados,
} from './ler-indexed-dat';
import { dataCobol, sanitizarTexto } from './migracao-utils';

config({ path: resolve(__dirname, '../.env') });

const prisma = new PrismaClient();
const BATCH = 1000;

function parseDecimalDisplay(
  raw: string,
  casas: number,
): string | null {
  const digitos = String(raw ?? '').replace(/\D/g, '');
  if (!digitos || /^0+$/.test(digitos)) return null;
  const padded = digitos.padStart(casas + 1, '0');
  const intPart = padded.slice(0, -casas) || '0';
  const decPart = padded.slice(-casas);
  return `${parseInt(intPart, 10)}.${decPart}`;
}

function dataYyyymmdd(n: number): Date | null {
  if (!n || n < 19000101) return null;
  const s = String(n).padStart(8, '0');
  return dataCobol(
    parseInt(s.slice(0, 4), 10),
    parseInt(s.slice(4, 6), 10),
    parseInt(s.slice(6, 8), 10),
  );
}

function parseItensPedido(buf: Buffer) {
  const itens = [];
  for (let i = 0; i < 8; i++) {
    const off = PCPA41I_ITENS_OFFSET + i * PCPA41I_ITEM_SIZE;
    const slice = buf.subarray(off, off + PCPA41I_ITEM_SIZE);
    const status = slice.toString('latin1', 0, 2).trim();
    const classeLetra = slice.toString('latin1', 2, 3).trim();
    const classeNumero = parseInt(slice.toString('latin1', 3, 5), 10) || 0;
    const itemCodigo = parseInt(slice.toString('latin1', 5, 10), 10) || 0;
    if (!classeLetra && !itemCodigo) continue;

    itens.push({
      status: status || null,
      classeLetra: classeLetra || ' ',
      classeNumero,
      itemCodigo,
      quantidade: parseDecimalDisplay(slice.toString('latin1', 10, 19), 3),
      preco: parseDecimalDisplay(slice.toString('latin1', 19, 31), 6),
      descricao: sanitizarTexto(slice.toString('latin1', 31, 71)) || null,
      espessura: parseDecimalDisplay(slice.toString('latin1', 71, 76), 2),
      condEntrega: sanitizarTexto(slice.toString('latin1', 76, 81)) || null,
      comprimento: parseInt(slice.toString('latin1', 81, 86), 10) || null,
      qualidade: sanitizarTexto(slice.toString('latin1', 86, 96)) || null,
      dureza: sanitizarTexto(slice.toString('latin1', 96, 106)) || null,
      largura: parseDecimalDisplay(slice.toString('latin1', 106, 114), 3),
    });
  }
  return itens.length ? itens : null;
}

async function flushBatches<T>(
  label: string,
  rows: T[],
  writer: (chunk: T[]) => Promise<unknown>,
) {
  let gravados = 0;
  for (let i = 0; i < rows.length; i += BATCH) {
    const chunk = rows.slice(i, i + BATCH);
    await writer(chunk);
    gravados += chunk.length;
    if (gravados % 10000 === 0 || gravados === rows.length) {
      console.log(`  … ${label}: ${gravados}/${rows.length}`);
    }
  }
  return gravados;
}

async function migrarPedidosCompra() {
  const caminho = caminhoLegado('PCPA41I.DAT');
  const registros = lerRegistrosIndexados(caminho, INDEXED_PCPA41I);

  console.log('Gravando pedidos de compra (PCPA41I)...');
  await prisma.pedidoCompra.deleteMany({});

  const rows: Prisma.PedidoCompraCreateManyInput[] = [];
  let ignorados = 0;

  for (const buf of registros) {
    const r = parseRegistro(buf, LAYOUT_PCPA41I);
    const codigo = r.codigo as number;
    if (!codigo) {
      ignorados++;
      continue;
    }

    const opRaw = buf.toString('latin1', PCPA41I_OP_OFFSET, PCPA41I_OP_OFFSET + 8);
    const ordemProducaoCodigo = parseInt(opRaw, 10) || null;
    const footerBase = PCPA41I_OP_OFFSET - 10 - 10 - 10 - 5 - 8;
    // data entrega / cliente / depto / setor / cond: antes do OP
    const dataEntrega = dataYyyymmdd(
      parseInt(buf.toString('latin1', footerBase, footerBase + 8), 10) || 0,
    );
    const clienteCodigo =
      parseInt(buf.toString('latin1', footerBase + 8, footerBase + 13), 10) || null;
    const depto = sanitizarTexto(
      buf.toString('latin1', footerBase + 13, footerBase + 23),
    );
    const setor = sanitizarTexto(
      buf.toString('latin1', footerBase + 23, footerBase + 33),
    );
    const condEntrega = sanitizarTexto(
      buf.toString('latin1', footerBase + 33, footerBase + 43),
    );

    rows.push({
      codigo,
      pedidoFornecedor: (r.pedidoFornecedor as number) || null,
      codFornecedor: (r.codFornecedor as number) || null,
      nomeFornecedor: sanitizarTexto(String(r.nomeFornecedor)) || null,
      flag: sanitizarTexto(String(r.flag)) || null,
      cancela: sanitizarTexto(String(r.cancela)) || null,
      liberacao: sanitizarTexto(String(r.liberacao)) || null,
      localEntrega: sanitizarTexto(String(r.localEntrega)) || null,
      dataPedido: dataCobol(
        r.anoPedido as number,
        r.mesPedido as number,
        r.diaPedido as number,
      ),
      dataLiberacao: dataYyyymmdd(r.dtLib as number),
      dataRequisicao: dataYyyymmdd(r.dtReq as number),
      dataEntrega,
      clienteCodigo,
      depto: depto || null,
      setor: setor || null,
      condEntrega: condEntrega || null,
      ordemProducaoCodigo,
      itens: parseItensPedido(buf) ?? undefined,
    });
  }

  const ok = await flushBatches('PedidoCompra', rows, (chunk) =>
    prisma.pedidoCompra.createMany({ data: chunk }),
  );

  await prisma.migracaoLog.create({
    data: {
      arquivoOrigem: 'PCPA41I.DAT',
      registrosLidos: registros.length,
      registrosOk: ok,
      registrosErro: 0,
      mensagem: `${ignorados} sem código ignorados`,
    },
  });

  console.log(
    `✓ Pedidos compra: ${ok} gravados, ${ignorados} ignorados (${registros.length} lidos)`,
  );
}

async function migrarPedidosMpAbertos() {
  const caminho = caminhoLegado('PCPA41II.DAT');
  const registros = lerRegistrosIndexados(caminho, INDEXED_PCPA41II);

  console.log('Gravando pedidos MP abertos (PCPA41II)...');
  await prisma.pedidoMpAberto.deleteMany({});

  const mps = await prisma.materiaPrima.findMany({
    select: { id: true, classeLetra: true, classeNumero: true, itemCodigo: true },
  });
  const lookup = new Map(
    mps.map((m) => [`${m.classeLetra}|${m.classeNumero}|${m.itemCodigo}`, m.id]),
  );

  const rows: Prisma.PedidoMpAbertoCreateManyInput[] = [];
  let ignorados = 0;

  for (const buf of registros) {
    const r = parseRegistro(buf, LAYOUT_PCPA41II);
    const classeLetra = sanitizarTexto(String(r.classeLetra)).slice(0, 1);
    const classeNumero = r.classeNumero as number;
    const itemCodigo = r.item as number;
    const pedidoCodigo = r.pedido as number;
    const indice = r.indice as number;
    if (!classeLetra || !pedidoCodigo) {
      ignorados++;
      continue;
    }

    const quantidade =
      parseDecimalDisplay(String(r.quantidade), 3) ?? '0.000';

    rows.push({
      classeLetra,
      classeNumero,
      itemCodigo,
      pedidoCodigo,
      indice,
      quantidade,
      flag: sanitizarTexto(String(r.flag)) || null,
      ordemProducaoCodigo: (r.ordemProducao as number) || null,
      materiaPrimaId:
        lookup.get(`${classeLetra}|${classeNumero}|${itemCodigo}`) ?? null,
    });
  }

  const ok = await flushBatches('PedidoMpAberto', rows, (chunk) =>
    prisma.pedidoMpAberto.createMany({ data: chunk, skipDuplicates: true }),
  );

  await prisma.migracaoLog.create({
    data: {
      arquivoOrigem: 'PCPA41II.DAT',
      registrosLidos: registros.length,
      registrosOk: ok,
      registrosErro: 0,
      mensagem: `${ignorados} inválidos ignorados`,
    },
  });

  console.log(
    `✓ Pedidos MP abertos: ${ok} gravados, ${ignorados} ignorados (${registros.length} lidos)`,
  );
}

async function migrarNrmp() {
  const caminho = caminhoLegado('PCPA73I.DAT');
  const registros = lerRegistrosIndexados(caminho, INDEXED_PCPA73I);

  console.log('Gravando NRMP (PCPA73I)...');
  await prisma.nrmp.deleteMany({});

  const mps = await prisma.materiaPrima.findMany({
    select: { id: true, classeLetra: true, classeNumero: true, itemCodigo: true },
  });
  const lookup = new Map(
    mps.map((m) => [`${m.classeLetra}|${m.classeNumero}|${m.itemCodigo}`, m.id]),
  );

  const rows: Prisma.NrmpCreateManyInput[] = [];
  let ignorados = 0;
  const vistos = new Set<string>();

  for (const buf of registros) {
    const r = parseRegistro(buf, LAYOUT_PCPA73I);
    const numero = r.numero as number;
    if (!numero) {
      ignorados++;
      continue;
    }

    const letra = sanitizarTexto(String(r.letra)).padEnd(1, ' ').slice(0, 2) || ' ';
    const letra2 = sanitizarTexto(String(r.letra2));
    const chave = `${letra}|${numero}|${letra2}`;
    if (vistos.has(chave)) {
      ignorados++;
      continue;
    }
    vistos.add(chave);

    const classeLetra = sanitizarTexto(String(r.classeLetra)).slice(0, 1) || null;
    const classeNumero = (r.classeNumero as number) || null;
    const itemCodigo = (r.item as number) || null;
    const dataEntrada = dataCobol(
      r.ano as number,
      r.mes as number,
      r.dia as number,
    );

    rows.push({
      letra: letra.slice(0, 2).padEnd(2, ' '),
      numero,
      letra2: letra2.slice(0, 2),
      classeLetra,
      classeNumero,
      itemCodigo,
      dataEntrada,
      fornecedorCodigo: (r.fornecedor as number) || null,
      nota: (r.nota as number) || null,
      serie: sanitizarTexto(String(r.serie)) || null,
      corrida: sanitizarTexto(String(r.corrida)) || null,
      quantidade: parseDecimalDisplay(String(r.quantidade), 3),
      valorUnitario: parseDecimalDisplay(String(r.valorUnitario), 3),
      produtoCodigo: sanitizarTexto(String(r.produto)) || null,
      ofCodigo: sanitizarTexto(String(r.ofCodigo)) || null,
      materiaPrimaId:
        classeLetra && itemCodigo != null
          ? lookup.get(`${classeLetra}|${classeNumero}|${itemCodigo}`) ?? null
          : null,
    });
  }

  const ok = await flushBatches('Nrmp', rows, (chunk) =>
    prisma.nrmp.createMany({ data: chunk, skipDuplicates: true }),
  );

  await prisma.migracaoLog.create({
    data: {
      arquivoOrigem: 'PCPA73I.DAT',
      registrosLidos: registros.length,
      registrosOk: ok,
      registrosErro: 0,
      mensagem: `${ignorados} vazios/duplicados ignorados`,
    },
  });

  console.log(
    `✓ NRMP: ${ok} gravados, ${ignorados} ignorados (${registros.length} lidos)`,
  );
}

async function migrarNrmpConsulta() {
  const caminho = caminhoLegado('PCPA73II.DAT');
  const registros = lerRegistrosIndexados(caminho, INDEXED_PCPA73II);

  console.log('Gravando consulta NRMP (PCPA73II)...');
  await prisma.nrmpConsulta.deleteMany({});

  let ok = 0;
  let ignorados = 0;

  for (const buf of registros) {
    const r = parseRegistro(buf, LAYOUT_PCPA73II);
    const numero = r.numero as number;
    const letra = sanitizarTexto(String(r.letra));
    if (!numero && !letra) {
      ignorados++;
      continue;
    }

    await prisma.nrmpConsulta.create({
      data: {
        letra: (letra || ' ').slice(0, 2).padEnd(2, ' '),
        numero,
        letra2: sanitizarTexto(String(r.letra2)).slice(0, 2),
        nota: (r.nota as number) || null,
        tipo: sanitizarTexto(String(r.tipo)) || null,
        data: dataCobol(r.ano as number, r.mes as number, r.dia as number),
        pedidoCodigo: (r.pedido as number) || null,
        quantidade: parseDecimalDisplay(String(r.quantidade), 3),
        tipoNota: sanitizarTexto(String(r.tipoNota)) || null,
      },
    });
    ok++;
  }

  await prisma.migracaoLog.create({
    data: {
      arquivoOrigem: 'PCPA73II.DAT',
      registrosLidos: registros.length,
      registrosOk: ok,
      registrosErro: 0,
      mensagem: `${ignorados} vazios ignorados`,
    },
  });

  console.log(
    `✓ Consulta NRMP: ${ok} gravados (${registros.length} lidos)`,
  );
}

async function migrarSaldoPlanejamento() {
  const caminho = caminhoLegado('PCPA68I.DAT');
  const registros = lerRegistrosIndexados(caminho, INDEXED_PCPA68I);

  console.log('Gravando saldo planejamento (PCPA68I)...');
  await prisma.saldoPlanejamento.deleteMany({});

  let ok = 0;
  let ignorados = 0;

  for (const buf of registros) {
    const r = parseRegistro(buf, LAYOUT_PCPA68I);
    const ano = r.ano as number;
    const mes = r.mes as number;
    if (!ano || !mes) {
      ignorados++;
      continue;
    }

    const saldoDigitos = String(r.saldo ?? '').replace(/\D/g, '');
    // S9(12) sem casas — evita parseDecimalDisplay(..., 0) que zera o valor
    const saldoRaw = saldoDigitos ? String(parseInt(saldoDigitos, 10) || 0) : '0';

    try {
      await prisma.saldoPlanejamento.upsert({
        where: {
          ano_mes_grupoCodigo_classificacaoCodigo_itemCodigo: {
            ano,
            mes,
            grupoCodigo: r.grupoCodigo as number,
            classificacaoCodigo: r.classificacaoCodigo as number,
            itemCodigo: r.itemCodigo as number,
          },
        },
        create: {
          ano,
          mes,
          grupoCodigo: r.grupoCodigo as number,
          classificacaoCodigo: r.classificacaoCodigo as number,
          itemCodigo: r.itemCodigo as number,
          saldo: saldoRaw,
        },
        update: { saldo: saldoRaw },
      });
      ok++;
    } catch (e) {
      console.error('Erro saldo:', r, e);
    }
  }

  await prisma.migracaoLog.create({
    data: {
      arquivoOrigem: 'PCPA68I.DAT',
      registrosLidos: registros.length,
      registrosOk: ok,
      registrosErro: 0,
      mensagem: `${ignorados} sem ano/mês ignorados`,
    },
  });

  console.log(
    `✓ Saldo planejamento: ${ok} gravados, ${ignorados} ignorados (${registros.length} lidos)`,
  );
}

async function main() {
  console.log('Migração Pacote D — compras / NRMP / saldo');
  console.log('Origem:', process.env.LEGACY_DATA_PATH);
  console.log('---');

  for (const l of [
    LAYOUT_PCPA41I,
    LAYOUT_PCPA41II,
    LAYOUT_PCPA73I,
    LAYOUT_PCPA73II,
    LAYOUT_PCPA68I,
  ]) {
    validarLayout(l);
  }

  // Ordem: pedidos → abertos → entradas NRMP → saldo
  await migrarPedidosCompra();
  await migrarPedidosMpAbertos();
  await migrarNrmp();
  await migrarNrmpConsulta();
  await migrarSaldoPlanejamento();

  console.log('---');
  console.log('Pacote D concluído.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
