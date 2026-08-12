/**
 * B8 — conferência técnica independente: totais e amostra campo a campo
 * comparando a leitura direta dos .DAT legados (não os scripts migrar:*)
 * contra o que está gravado no PostgreSQL.
 *
 * Não substitui a conferência visual do usuário-chave FANANDRI no COBOL
 * (ver docs/07-plano-homologacao.md) — é a parte técnica de B8, que não
 * depende de rodar o legado interativamente.
 *
 * Uso: npx tsx src/verificar-b8.ts
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { PrismaClient } from '@prisma/client';
import { caminhoLegado, parseRegistro } from './parse-dat';
import { LAYOUT_PCPA18I } from './layouts/pcpa18i';
import { LAYOUT_PCPA22I } from './layouts/pcpa22i';
import { LAYOUT_PCPA28I } from './layouts/pcpa28i';
import {
  INDEXED_PCPA18I,
  INDEXED_PCPA22I,
  INDEXED_PCPA28I,
  lerRegistrosIndexados,
} from './ler-indexed-dat';
import { sanitizarTexto } from './migracao-utils';

config({ path: resolve(__dirname, '../.env') });

const prisma = new PrismaClient();

function amostraAleatoria<T>(arr: T[], n: number): T[] {
  const copia = [...arr];
  const resultado: T[] = [];
  for (let i = 0; i < n && copia.length > 0; i++) {
    const idx = Math.floor(Math.random() * copia.length);
    resultado.push(copia.splice(idx, 1)[0]);
  }
  return resultado;
}

async function verificarProdutos() {
  console.log('\n=== PRODUTOS (PCPA18I) ===');
  const caminho = caminhoLegado('PCPA18I.DAT');
  const registros = lerRegistrosIndexados(caminho, INDEXED_PCPA18I);

  const validos = registros
    .map((buf) => parseRegistro(buf, LAYOUT_PCPA18I))
    .filter((r) => !(r.grupo === 0 && r.item === 0));

  const totalLegado = validos.length;
  const totalBanco = await prisma.produto.count();
  console.log(`Total legado (registros válidos): ${totalLegado}`);
  console.log(`Total PostgreSQL: ${totalBanco}`);
  console.log(totalLegado === totalBanco ? '✓ contagem bate' : '✗ DIVERGÊNCIA de contagem');

  const amostra = amostraAleatoria(validos, 10);
  let ok = 0;
  for (const r of amostra) {
    const grupo = r.grupo as number;
    const classificacao = r.classificacao as number;
    const item = r.item as number;
    const produtoBanco = await prisma.produto.findUnique({
      where: {
        grupoCodigo_classificacaoCodigo_itemCodigo: {
          grupoCodigo: grupo,
          classificacaoCodigo: classificacao,
          itemCodigo: item,
        },
      },
    });

    const descLegado = sanitizarTexto(String(r.descricao));
    const codigo = `${grupo}-${classificacao}-${item}`;

    if (!produtoBanco) {
      console.log(`✗ ${codigo}: NÃO ENCONTRADO no banco (legado: "${descLegado}")`);
      continue;
    }

    const bate = produtoBanco.descricao.trim() === descLegado.trim();
    if (bate) ok++;
    console.log(
      `${bate ? '✓' : '✗'} ${codigo}: legado="${descLegado}" banco="${produtoBanco.descricao}"`,
    );
  }
  console.log(`Amostra: ${ok}/${amostra.length} campos "descrição" batendo`);
}

async function verificarMateriaPrima() {
  console.log('\n=== MATÉRIA-PRIMA (PCPA22I) ===');
  const caminho = caminhoLegado('PCPA22I.DAT');
  const registros = lerRegistrosIndexados(caminho, INDEXED_PCPA22I);

  const validos = registros
    .map((buf) => parseRegistro(buf, LAYOUT_PCPA22I))
    .filter((r) => !(!String(r.classeLetra).trim() && r.item === 0));

  const totalLegado = validos.length;
  const totalBanco = await prisma.materiaPrima.count();
  console.log(`Total legado (registros válidos): ${totalLegado}`);
  console.log(`Total PostgreSQL: ${totalBanco}`);
  console.log(totalLegado === totalBanco ? '✓ contagem bate' : '✗ DIVERGÊNCIA de contagem');

  const amostra = amostraAleatoria(validos, 10);
  let ok = 0;
  for (const r of amostra) {
    const classeLetra = String(r.classeLetra).trim() || ' ';
    const classeNumero = r.classeNumero as number;
    const item = r.item as number;
    const mpBanco = await prisma.materiaPrima.findUnique({
      where: {
        classeLetra_classeNumero_itemCodigo: { classeLetra, classeNumero, itemCodigo: item },
      },
    });

    const descLegado = sanitizarTexto(String(r.descricao));
    const codigo = `${classeLetra}${classeNumero}${item}`;

    if (!mpBanco) {
      console.log(`✗ ${codigo}: NÃO ENCONTRADO no banco (legado: "${descLegado}")`);
      continue;
    }

    const bate = mpBanco.descricao.trim() === descLegado.trim();
    if (bate) ok++;
    console.log(
      `${bate ? '✓' : '✗'} ${codigo}: legado="${descLegado}" banco="${mpBanco.descricao}"`,
    );
  }
  console.log(`Amostra: ${ok}/${amostra.length} campos "descrição" batendo`);
}

async function verificarOps() {
  console.log('\n=== ORDENS DE PRODUÇÃO (PCPA28I) ===');
  const caminho = caminhoLegado('PCPA28I.DAT');
  const registros = lerRegistrosIndexados(caminho, INDEXED_PCPA28I);

  const validos = registros
    .map((buf) => parseRegistro(buf, LAYOUT_PCPA28I))
    .filter((r) => (r.codigo as number) > 0);

  const totalLegado = validos.length;
  const abertasLegado = validos.filter((r) => String(r.baixada).trim().toUpperCase() !== 'S').length;

  const totalBanco = await prisma.ordemProducao.count();
  const abertasBanco = await prisma.ordemProducao.count({ where: { baixada: false } });

  console.log(`Total OPs — legado: ${totalLegado} | banco: ${totalBanco}`);
  console.log(totalLegado === totalBanco ? '✓ contagem total bate' : '✗ DIVERGÊNCIA de contagem total');
  console.log(`OPs abertas — legado: ${abertasLegado} | banco: ${abertasBanco}`);
  console.log(abertasLegado === abertasBanco ? '✓ contagem de abertas bate' : '✗ DIVERGÊNCIA de abertas');

  const amostra = amostraAleatoria(validos, 10);
  let ok = 0;
  for (const r of amostra) {
    const codigo = r.codigo as number;
    const opBanco = await prisma.ordemProducao.findUnique({ where: { codigo } });

    if (!opBanco) {
      console.log(`✗ OP ${codigo}: NÃO ENCONTRADA no banco`);
      continue;
    }

    const quantidadeLegado = r.quantidade as number;
    const baixadaLegado = String(r.baixada).trim().toUpperCase() === 'S';
    const tipoLegado = sanitizarTexto(String(r.tipo));

    const campos = [
      ['quantidade', quantidadeLegado === opBanco.quantidade],
      ['baixada', baixadaLegado === opBanco.baixada],
      ['tipo', tipoLegado.trim() === (opBanco.tipo ?? '').trim()],
    ] as const;

    const bate = campos.every(([, v]) => v);
    if (bate) ok++;
    console.log(
      `${bate ? '✓' : '✗'} OP ${codigo}: qtd legado=${quantidadeLegado}/banco=${opBanco.quantidade}` +
        ` baixada legado=${baixadaLegado}/banco=${opBanco.baixada}` +
        ` tipo legado="${tipoLegado}"/banco="${opBanco.tipo}"`,
    );
  }
  console.log(`Amostra: ${ok}/${amostra.length} OPs 100% batendo`);
}

async function main() {
  console.log('B8 — conferência técnica legado (.DAT) vs PostgreSQL');
  console.log('Origem:', process.env.LEGACY_DATA_PATH);

  await verificarProdutos();
  await verificarMateriaPrima();
  await verificarOps();

  console.log('\n--- Conferência técnica concluída ---');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
