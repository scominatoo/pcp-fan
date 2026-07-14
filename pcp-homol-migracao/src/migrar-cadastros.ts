/**
 * Script de migração — cadastros mestres (produtos e matéria-prima)
 *
 * Lê arquivos .DAT indexados do Micro Focus com passo físico calibrado.
 * Não usar lerRegistrosFixos() — arquivos INDEXED têm overhead por registro.
 *
 * Uso:
 *   cd tools/migracao
 *   npm run migrar:cadastros
 *
 * Requer: PostgreSQL rodando + prisma migrate já executado na API (pcp-homol-api)
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { PrismaClient } from '@prisma/client';
import { caminhoLegado, parseRegistro } from './parse-dat';
import { LAYOUT_PCPA18I } from './layouts/pcpa18i';
import { LAYOUT_PCPA19I } from './layouts/pcpa19i';
import { LAYOUT_PCPA20I } from './layouts/pcpa20i';
import { LAYOUT_PCPA22I } from './layouts/pcpa22i';
import {
  INDEXED_PCPA18I,
  INDEXED_PCPA19I,
  INDEXED_PCPA20I,
  INDEXED_PCPA22I,
  lerRegistrosIndexados,
} from './ler-indexed-dat';

config({ path: resolve(__dirname, '../.env') });

const prisma = new PrismaClient();

async function migrarGrupos() {
  const caminho = caminhoLegado('PCPA19I.DAT');
  const registros = lerRegistrosIndexados(caminho, INDEXED_PCPA19I);

  let ok = 0;
  let erros = 0;

  for (const buf of registros) {
    const r = parseRegistro(buf, LAYOUT_PCPA19I);
    const codigo = r.codigo as number;
    if (codigo === 0) continue;

    try {
      await prisma.produtoGrupo.upsert({
        where: { codigo },
        create: {
          codigo,
          descricao: String(r.descricao),
          explosao: String(r.explosao) || null,
        },
        update: {
          descricao: String(r.descricao),
          explosao: String(r.explosao) || null,
        },
      });
      ok++;
    } catch (e) {
      erros++;
      if (erros <= 3) console.error('Erro grupo:', r, e);
    }
  }

  await prisma.migracaoLog.create({
    data: {
      arquivoOrigem: 'PCPA19I.DAT',
      registrosLidos: registros.length,
      registrosOk: ok,
      registrosErro: erros,
    },
  });

  console.log(`✓ Grupos: ${ok} gravados, ${erros} erros (${registros.length} lidos)`);
}

async function migrarClassificacoes() {
  const caminho = caminhoLegado('PCPA20I.DAT');
  const registros = lerRegistrosIndexados(caminho, INDEXED_PCPA20I);

  let ok = 0;
  let erros = 0;

  for (const buf of registros) {
    const r = parseRegistro(buf, LAYOUT_PCPA20I);
    const codigo = r.codigo as number;
    if (codigo === 0) continue;

    try {
      await prisma.produtoClassificacao.upsert({
        where: { codigo },
        create: {
          codigo,
          descricao: String(r.descricao),
        },
        update: {
          descricao: String(r.descricao),
        },
      });
      ok++;
    } catch (e) {
      erros++;
      if (erros <= 3) console.error('Erro classificação:', r, e);
    }
  }

  await prisma.migracaoLog.create({
    data: {
      arquivoOrigem: 'PCPA20I.DAT',
      registrosLidos: registros.length,
      registrosOk: ok,
      registrosErro: erros,
    },
  });

  console.log(
    `✓ Classificações: ${ok} gravadas, ${erros} erros (${registros.length} lidos)`,
  );
}

async function migrarProdutos() {
  const caminho = caminhoLegado('PCPA18I.DAT');
  const registros = lerRegistrosIndexados(caminho, INDEXED_PCPA18I);

  let ok = 0;
  let erros = 0;
  let ignorados = 0;

  for (const buf of registros) {
    const r = parseRegistro(buf, LAYOUT_PCPA18I);
    const grupo = r.grupo as number;
    const classificacao = r.classificacao as number;
    const item = r.item as number;

    if (grupo === 0 && item === 0) {
      ignorados++;
      continue;
    }

    try {
      await prisma.produto.upsert({
        where: {
          grupoCodigo_classificacaoCodigo_itemCodigo: {
            grupoCodigo: grupo,
            classificacaoCodigo: classificacao,
            itemCodigo: item,
          },
        },
        create: {
          grupoCodigo: grupo,
          classificacaoCodigo: classificacao,
          itemCodigo: item,
          descricao: String(r.descricao),
          unidade: String(r.unidade) || null,
          desenhoSparta: String(r.desenhoSparta) || null,
          desenhoCliente: String(r.desenhoCliente) || null,
          planejamento: String(r.planejamento) || null,
        },
        update: {
          descricao: String(r.descricao),
          unidade: String(r.unidade) || null,
          desenhoCliente: String(r.desenhoCliente) || null,
        },
      });
      ok++;
    } catch (e) {
      erros++;
      if (erros <= 5) console.error('Erro produto:', r, e);
    }
  }

  await prisma.migracaoLog.create({
    data: {
      arquivoOrigem: 'PCPA18I.DAT',
      registrosLidos: registros.length,
      registrosOk: ok,
      registrosErro: erros,
      mensagem: `${ignorados} slots vazios ignorados (indexed stride=292)`,
    },
  });

  console.log(
    `✓ Produtos: ${ok} gravados, ${erros} erros, ${ignorados} vazios (${registros.length} lidos)`,
  );
}

async function migrarMateriaPrima() {
  const caminho = caminhoLegado('PCPA22I.DAT');
  const registros = lerRegistrosIndexados(caminho, INDEXED_PCPA22I);

  let ok = 0;
  let erros = 0;
  let ignorados = 0;

  for (const buf of registros) {
    const r = parseRegistro(buf, LAYOUT_PCPA22I);
    const classeLetra = String(r.classeLetra);
    const classeNumero = r.classeNumero as number;
    const item = r.item as number;

    if (!classeLetra.trim() && item === 0) {
      ignorados++;
      continue;
    }

    try {
      await prisma.materiaPrima.upsert({
        where: {
          classeLetra_classeNumero_itemCodigo: {
            classeLetra: classeLetra || ' ',
            classeNumero,
            itemCodigo: item,
          },
        },
        create: {
          classeLetra: classeLetra || ' ',
          classeNumero,
          itemCodigo: item,
          descricao: String(r.descricao),
          unidade: String(r.unidade) || null,
          qualidade: String(r.qualidade) || null,
          dureza: String(r.dureza) || null,
        },
        update: {
          descricao: String(r.descricao),
          unidade: String(r.unidade) || null,
          qualidade: String(r.qualidade) || null,
          dureza: String(r.dureza) || null,
        },
      });
      ok++;
    } catch (e) {
      erros++;
      if (erros <= 5) console.error('Erro MP:', r, e);
    }
  }

  await prisma.migracaoLog.create({
    data: {
      arquivoOrigem: 'PCPA22I.DAT',
      registrosLidos: registros.length,
      registrosOk: ok,
      registrosErro: erros,
      mensagem: `${ignorados} slots vazios ignorados (indexed stride=396)`,
    },
  });

  console.log(
    `✓ Matéria-prima: ${ok} gravados, ${erros} erros, ${ignorados} vazios (${registros.length} lidos)`,
  );
}

async function main() {
  console.log('Origem dos dados:', process.env.LEGACY_DATA_PATH);
  console.log('Modo: leitura INDEXED (Micro Focus)');
  console.log('---');

  await migrarGrupos();
  await migrarClassificacoes();
  await migrarProdutos();
  await migrarMateriaPrima();

  console.log('---');
  console.log('Migração de cadastros concluída.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
