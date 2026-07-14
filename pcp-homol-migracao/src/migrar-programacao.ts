/**
 * Migração — programação de entregas (PCPA66I)
 *
 * Uso: npm run migrar:programacao
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { Prisma, PrismaClient } from '@prisma/client';
import { caminhoLegado, parseRegistro } from './parse-dat';
import { LAYOUT_PCPA66I } from './layouts/pcpa66i';
import { INDEXED_PCPA66I, lerRegistrosIndexados } from './ler-indexed-dat';
import { dataCobol, flagSn, sanitizarTexto } from './migracao-utils';

config({ path: resolve(__dirname, '../.env') });

const prisma = new PrismaClient();

async function carregarProdutos() {
  const produtos = await prisma.produto.findMany({
    select: {
      id: true,
      grupoCodigo: true,
      classificacaoCodigo: true,
      itemCodigo: true,
      desenhoCliente: true,
    },
  });

  const porChave = new Map<string, number>();
  const porDesenho = new Map<string, number>();

  for (const p of produtos) {
    porChave.set(
      `${p.grupoCodigo}|${p.classificacaoCodigo}|${p.itemCodigo}`,
      p.id,
    );
    if (p.desenhoCliente?.trim()) {
      porDesenho.set(p.desenhoCliente.trim(), p.id);
    }
  }

  return { porChave, porDesenho };
}

function resolverProduto(
  r: Record<string, string | number>,
  porChave: Map<string, number>,
  porDesenho: Map<string, number>,
) {
  let grupo = (r.grupo as number) || 0;
  let classificacao = (r.classificacao as number) || 0;
  let item = (r.item as number) || 0;
  const desenho = sanitizarTexto(String(r.desenhoCliente));

  if (grupo === 0 && item === 0 && desenho) {
    const id = porDesenho.get(desenho);
    return { grupo, classificacao, item, desenho, produtoId: id ?? null };
  }

  const produtoId =
    porChave.get(`${grupo}|${classificacao}|${item}`) ?? null;
  return { grupo, classificacao, item, desenho: desenho || null, produtoId };
}

async function main() {
  console.log('Migração de programação de entregas');
  console.log('Origem:', process.env.LEGACY_DATA_PATH);
  console.log('---');

  const { porChave, porDesenho } = await carregarProdutos();
  const caminho = caminhoLegado('PCPA66I.DAT');
  const registros = lerRegistrosIndexados(caminho, INDEXED_PCPA66I);

  console.log('Gravando programação (PCPA66I)...');
  await prisma.programacaoEntrega.deleteMany({});

  let ok = 0;
  let ignorados = 0;
  const batch: Prisma.ProgramacaoEntregaCreateManyInput[] = [];

  for (const buf of registros) {
    const r = parseRegistro(buf, LAYOUT_PCPA66I);
    const flag = sanitizarTexto(String(r.flag));
    const dataProgramacao = dataCobol(
      r.ano as number,
      r.mes as number,
      r.dia as number,
    );

    if (!dataProgramacao || !flag) {
      ignorados++;
      continue;
    }

    const prod = resolverProduto(r, porChave, porDesenho);
    const quantidade = (r.quantidade as number) || 0;

    if (
      prod.grupo === 0 &&
      prod.item === 0 &&
      !prod.desenho &&
      quantidade === 0
    ) {
      ignorados++;
      continue;
    }

    batch.push({
      dataProgramacao,
      produtoId: prod.produtoId,
      grupoCodigo: prod.grupo,
      classificacaoCodigo: prod.classificacao,
      itemCodigo: prod.item,
      plano: sanitizarTexto(String(r.plano)) || '',
      flag,
      quantidade,
      pedidoRef: sanitizarTexto(String(r.pedidoRef)) || null,
      pedidoRef2: sanitizarTexto(String(r.pedidoRef2)) || null,
      desenhoCliente: prod.desenho || '',
      qtdeEntregue: (r.qtdeEntregue as number) || 0,
      qtdeAProduzir: (r.qtdeAProduzir as number) || 0,
      devolvido: flagSn(String(r.flagDevolvido)),
    });

    if (batch.length >= 500) {
      const result = await prisma.programacaoEntrega.createMany({
        data: batch,
        skipDuplicates: true,
      });
      ok += result.count;
      batch.length = 0;
      if (ok % 2000 === 0) console.log(`  ... ${ok} registros`);
    }
  }

  if (batch.length > 0) {
    const result = await prisma.programacaoEntrega.createMany({
      data: batch,
      skipDuplicates: true,
    });
    ok += result.count;
  }

  await prisma.migracaoLog.create({
    data: {
      arquivoOrigem: 'PCPA66I.DAT',
      registrosLidos: registros.length,
      registrosOk: ok,
      registrosErro: 0,
      mensagem: `${ignorados} ignorados`,
    },
  });

  console.log(`✓ Programação: ${ok} gravados, ${ignorados} ignorados`);
  console.log('---');
  console.log('Migração de programação concluída.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
