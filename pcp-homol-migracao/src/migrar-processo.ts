/**
 * Migração — processo produtivo (PCPA70I + PCPA70XI)
 *
 * Estratégia: o roteiro (PCPA70XI) é a fonte principal; PCPA70I enriquece MPs/pesos.
 *
 * Uso: npm run migrar:processo
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { Prisma, PrismaClient } from '@prisma/client';
import { caminhoLegado, parseRegistro } from './parse-dat';
import { LAYOUT_PCPA70I } from './layouts/pcpa70i';
import { LAYOUT_PCPA70XI } from './layouts/pcpa70xi';
import {
  INDEXED_PCPA70I,
  INDEXED_PCPA70XI,
  lerRegistrosIndexados,
} from './ler-indexed-dat';
import {
  chaveProdutoCompacta,
  extrairMpsProcesso,
  normalizarProdutoCodigo,
  parseDecimalCobol,
  parseProdutoLegado,
  parseTabEquipamentos,
  sanitizarTexto,
  segundosCobol,
} from './migracao-utils';

config({ path: resolve(__dirname, '../.env') });

const prisma = new PrismaClient();

type LookupProduto = {
  porChave: Map<string, number>;
  porDesenhoCliente: Map<string, number>;
};

async function carregarLookupProdutos(): Promise<LookupProduto> {
  const produtos = await prisma.produto.findMany({
    select: {
      id: true,
      grupoCodigo: true,
      classificacaoCodigo: true,
      itemCodigo: true,
      desenhoCliente: true,
      desenhoSparta: true,
    },
  });
  const porChave = new Map<string, number>();
  const porDesenhoCliente = new Map<string, number>();

  for (const p of produtos) {
    porChave.set(
      chaveProdutoCompacta(
        p.grupoCodigo,
        p.classificacaoCodigo,
        p.itemCodigo,
      ),
      p.id,
    );
    if (p.desenhoCliente?.trim()) {
      porDesenhoCliente.set(p.desenhoCliente.trim(), p.id);
    }
    if (p.desenhoSparta?.trim()) {
      porDesenhoCliente.set(
        p.desenhoSparta.replace(/\./g, '').trim(),
        p.id,
      );
    }
  }

  return { porChave, porDesenhoCliente };
}

function resolverProdutoId(
  codigoRaw: string,
  lookup: LookupProduto,
): number | null {
  const limpo = normalizarProdutoCodigo(codigoRaw);
  if (!limpo) return null;

  const porDesenho = lookup.porDesenhoCliente.get(limpo);
  if (porDesenho) return porDesenho;

  const parsed = parseProdutoLegado(limpo);
  if (!parsed) return null;
  return (
    lookup.porChave.get(
      chaveProdutoCompacta(
        parsed.grupo,
        parsed.classificacao,
        parsed.item,
      ),
    ) ?? null
  );
}

/** Código de produto válido para processo (desenho cliente ou referência curta) */
function codigoProcessoValido(codigo: string, lookup: LookupProduto): boolean {
  const limpo = normalizarProdutoCodigo(codigo);
  if (!limpo || limpo.length > 15) return false;
  if (lookup.porDesenhoCliente.has(limpo)) return true;
  // Referências alfanuméricas curtas do legado (ex.: N01525)
  return /^[A-Z0-9][A-Z0-9.\-]{2,14}$/i.test(limpo);
}

async function garantirProcessosDeRoteiro(
  lookup: LookupProduto,
): Promise<Map<string, number>> {
  const caminho = caminhoLegado('PCPA70XI.DAT');
  const registros = lerRegistrosIndexados(caminho, INDEXED_PCPA70XI);
  const processoPorCodigo = new Map<string, number>();
  const produtosUnicos = new Set<string>();

  for (const buf of registros) {
    const r = parseRegistro(buf, LAYOUT_PCPA70XI);
    const produtoCodigo = normalizarProdutoCodigo(String(r.produto));
    if (codigoProcessoValido(produtoCodigo, lookup)) {
      produtosUnicos.add(produtoCodigo);
    }
  }

  let ok = 0;
  for (const produtoCodigo of produtosUnicos) {
    const produtoId = resolverProdutoId(produtoCodigo, lookup);
    const proc = await prisma.processoProdutivo.upsert({
      where: { produtoCodigo },
      create: { produtoCodigo, produtoId },
      update: { produtoId },
    });
    processoPorCodigo.set(produtoCodigo, proc.id);
    ok++;
  }

  console.log(
    `✓ Processos (roteiro): ${ok} cabeçalhos a partir de ${produtosUnicos.size} produtos únicos`,
  );
  return processoPorCodigo;
}

async function enriquecerDePcpa70I(
  lookup: LookupProduto,
  processoPorCodigo: Map<string, number>,
) {
  const caminho = caminhoLegado('PCPA70I.DAT');
  const registros = lerRegistrosIndexados(caminho, INDEXED_PCPA70I);

  let ok = 0;
  let ignorados = 0;

  for (const buf of registros) {
    const r = parseRegistro(buf, LAYOUT_PCPA70I);
    const produtoCodigo = normalizarProdutoCodigo(String(r.produto));
    if (!codigoProcessoValido(produtoCodigo, lookup)) {
      ignorados++;
      continue;
    }

    const pesoBruto = parseDecimalCobol(String(r.pesoBruto), 3);
    const pesoLiquido = parseDecimalCobol(String(r.pesoLiquido), 3);
    const mps = extrairMpsProcesso(r);
    const produtoId = resolverProdutoId(produtoCodigo, lookup);

    const proc = await prisma.processoProdutivo.upsert({
      where: { produtoCodigo },
      create: {
        produtoCodigo,
        produtoId,
        pesoBruto,
        pesoLiquido,
        qtdeOp: (r.qtdeOp as number) || null,
        producaoHr: (r.producaoHr as number) || null,
        materiasPrimas: mps ?? undefined,
      },
      update: {
        produtoId,
        pesoBruto,
        pesoLiquido,
        qtdeOp: (r.qtdeOp as number) || null,
        producaoHr: (r.producaoHr as number) || null,
        materiasPrimas: mps ?? undefined,
      },
    });
    processoPorCodigo.set(produtoCodigo, proc.id);
    ok++;
  }

  await prisma.migracaoLog.create({
    data: {
      arquivoOrigem: 'PCPA70I.DAT',
      registrosLidos: registros.length,
      registrosOk: ok,
      registrosErro: 0,
      mensagem: `${ignorados} registros inválidos ignorados`,
    },
  });

  console.log(`✓ Processos enriquecidos (PCPA70I): ${ok} registros`);
}

async function migrarOperacoesProcesso(processoPorCodigo: Map<string, number>) {
  const caminho = caminhoLegado('PCPA70XI.DAT');
  const registros = lerRegistrosIndexados(caminho, INDEXED_PCPA70XI);

  await prisma.processoOperacao.deleteMany({});

  let ok = 0;
  let ignorados = 0;
  const batch: Prisma.ProcessoOperacaoCreateManyInput[] = [];

  for (const buf of registros) {
    const r = parseRegistro(buf, LAYOUT_PCPA70XI);
    const produtoCodigo = normalizarProdutoCodigo(String(r.produto));
    const numeroOperacao = r.numeroOperacao as number;

    if (!produtoCodigo || numeroOperacao === 0) {
      ignorados++;
      continue;
    }

    const processoId = processoPorCodigo.get(produtoCodigo);
    if (!processoId) {
      ignorados++;
      continue;
    }

    const tab = parseTabEquipamentos(String(r.tabRaw));

    batch.push({
      processoId,
      numeroOperacao,
      descricao: sanitizarTexto(String(r.descricao)) || null,
      observacao1: sanitizarTexto(String(r.obs1)) || null,
      observacao2: sanitizarTexto(String(r.obs2)) || null,
      plano: sanitizarTexto(String(r.plano)) || null,
      secaoCodigo: (r.secaoCodigo as number) || null,
      preparacaoSegundos: segundosCobol(
        r.prepHr as number,
        r.prepMn as number,
        r.prepSg as number,
      ),
      producaoSegundos: segundosCobol(
        r.prodHr as number,
        r.prodMn as number,
        r.prodSg as number,
      ),
      cacamba: sanitizarTexto(String(r.cacamba)) || null,
      pecas: (r.pecas as number) || null,
      equipamentoEscolhido: (r.equipamentoEscolhido as number) || null,
      equipamentosTab: tab ?? undefined,
    });

    if (batch.length >= 500) {
      await prisma.processoOperacao.createMany({
        data: batch,
        skipDuplicates: true,
      });
      ok += batch.length;
      batch.length = 0;
    }
  }

  if (batch.length > 0) {
    await prisma.processoOperacao.createMany({
      data: batch,
      skipDuplicates: true,
    });
    ok += batch.length;
  }

  await prisma.migracaoLog.create({
    data: {
      arquivoOrigem: 'PCPA70XI.DAT',
      registrosLidos: registros.length,
      registrosOk: ok,
      registrosErro: 0,
      mensagem: `${ignorados} registros sem processo pai ignorados`,
    },
  });

  console.log(
    `✓ Operações de processo: ${ok} gravadas, ${ignorados} ignorados`,
  );
}

async function main() {
  console.log('Migração de processo produtivo');
  console.log('Origem:', process.env.LEGACY_DATA_PATH);
  console.log('---');

  const lookup = await carregarLookupProdutos();
  console.log(
    `Lookup produtos: ${lookup.porChave.size} chaves, ${lookup.porDesenhoCliente.size} desenhos`,
  );
  console.log('---');

  const processoPorCodigo = await garantirProcessosDeRoteiro(lookup);
  await enriquecerDePcpa70I(lookup, processoPorCodigo);
  await migrarOperacoesProcesso(processoPorCodigo);

  console.log('---');
  console.log('Migração de processo concluída.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
