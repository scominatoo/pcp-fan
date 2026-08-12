/**
 * Migração — relação matéria-prima × peça (PCPA103I / PC1103)
 *
 * Tabela de junção pura (sem campos extras): liga CHAVE-PECA (referência de
 * produto, mesmo formato X15 usado em OP-PRODUTO/PROCESSO-PRODUTO — em geral
 * o desenho do cliente) à chave de matéria-prima (classe letra+número+item).
 *
 * Uso: npm run migrar:prima-peca
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { Prisma, PrismaClient } from '@prisma/client';
import { caminhoLegado, parseRegistro } from './parse-dat';
import { LAYOUT_PCPA103I } from './layouts/pcpa103i';
import { INDEXED_PCPA103I, lerRegistrosIndexados } from './ler-indexed-dat';
import {
  chaveProdutoCompacta,
  normalizarProdutoCodigo,
  parseProdutoLegado,
  sanitizarTexto,
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
      chaveProdutoCompacta(p.grupoCodigo, p.classificacaoCodigo, p.itemCodigo),
      p.id,
    );
    if (p.desenhoCliente?.trim()) {
      porDesenhoCliente.set(p.desenhoCliente.trim(), p.id);
    }
    if (p.desenhoSparta?.trim()) {
      porDesenhoCliente.set(p.desenhoSparta.replace(/\./g, '').trim(), p.id);
    }
  }

  return { porChave, porDesenhoCliente };
}

function resolverProdutoId(codigoRaw: string, lookup: LookupProduto): number | null {
  const limpo = normalizarProdutoCodigo(codigoRaw);
  if (!limpo) return null;

  const porDesenho = lookup.porDesenhoCliente.get(limpo);
  if (porDesenho) return porDesenho;

  const parsed = parseProdutoLegado(limpo);
  if (!parsed) return null;
  return (
    lookup.porChave.get(
      chaveProdutoCompacta(parsed.grupo, parsed.classificacao, parsed.item),
    ) ?? null
  );
}

async function carregarLookupMateriaPrima(): Promise<Map<string, number>> {
  const mps = await prisma.materiaPrima.findMany({
    select: { id: true, classeLetra: true, classeNumero: true, itemCodigo: true },
  });
  const lookup = new Map<string, number>();
  for (const mp of mps) {
    lookup.set(`${mp.classeLetra}${mp.classeNumero}${mp.itemCodigo}`, mp.id);
  }
  return lookup;
}

async function migrarPrimaPeca() {
  const caminho = caminhoLegado('PCPA103I.DAT');
  const registros = lerRegistrosIndexados(caminho, INDEXED_PCPA103I);

  const lookupProduto = await carregarLookupProdutos();
  const lookupMp = await carregarLookupMateriaPrima();
  console.log(
    `Lookup produtos: ${lookupProduto.porChave.size} chaves, ${lookupProduto.porDesenhoCliente.size} desenhos`,
  );
  console.log(`Lookup matéria-prima: ${lookupMp.size} chaves`);

  await prisma.materiaPrimaPeca.deleteMany({});

  let ignorados = 0;
  let semProduto = 0;
  let semMateriaPrima = 0;
  const vistos = new Set<string>();
  const batch: Prisma.MateriaPrimaPecaCreateManyInput[] = [];
  let ok = 0;

  for (const buf of registros) {
    const r = parseRegistro(buf, LAYOUT_PCPA103I);
    const produtoCodigo = normalizarProdutoCodigo(String(r.chavePeca));
    const classeLetra = sanitizarTexto(String(r.classeLetra));
    const classeNumero = r.classeNumero as number;
    const item = r.item as number;

    if (!produtoCodigo || (!classeLetra && item === 0)) {
      ignorados++;
      continue;
    }

    const chaveDup = `${produtoCodigo}|${classeLetra}|${classeNumero}|${item}`;
    if (vistos.has(chaveDup)) {
      ignorados++;
      continue;
    }
    vistos.add(chaveDup);

    const produtoId = resolverProdutoId(produtoCodigo, lookupProduto);
    if (!produtoId) semProduto++;

    const materiaPrimaId = lookupMp.get(`${classeLetra}${classeNumero}${item}`) ?? null;
    if (!materiaPrimaId) semMateriaPrima++;

    batch.push({
      produtoCodigo,
      produtoId,
      classeLetra: classeLetra || ' ',
      classeNumero,
      itemCodigo: item,
      materiaPrimaId,
    });

    if (batch.length >= 500) {
      await prisma.materiaPrimaPeca.createMany({ data: batch, skipDuplicates: true });
      ok += batch.length;
      batch.length = 0;
    }
  }

  if (batch.length > 0) {
    await prisma.materiaPrimaPeca.createMany({ data: batch, skipDuplicates: true });
    ok += batch.length;
  }

  await prisma.migracaoLog.create({
    data: {
      arquivoOrigem: 'PCPA103I.DAT',
      registrosLidos: registros.length,
      registrosOk: ok,
      registrosErro: 0,
      mensagem: `${ignorados} ignorados (vazio/duplicado); ${semProduto} sem produtoId; ${semMateriaPrima} sem materiaPrimaId (FKs opcionais)`,
    },
  });

  console.log(
    `✓ Matéria-prima × peça: ${ok} gravados, ${ignorados} ignorados (${registros.length} lidos)`,
  );
  console.log(
    `  ${semProduto} sem produto resolvido, ${semMateriaPrima} sem matéria-prima resolvida`,
  );
}

async function main() {
  console.log('Migração de matéria-prima × peça (PCPA103I)');
  console.log('Origem:', process.env.LEGACY_DATA_PATH);
  console.log('---');

  await migrarPrimaPeca();

  console.log('---');
  console.log('Migração de matéria-prima × peça concluída.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
