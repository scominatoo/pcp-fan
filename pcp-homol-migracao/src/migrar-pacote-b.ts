/**
 * Migração — Pacote B: complementar processo + ferramentas
 *
 *   1. PCPA70C  — MPs complementares do processo (PC1070)
 *   2. PCPA129I — cadastro de ferramentas (PC1128)
 *
 * Uso: npm run migrar:pacote-b
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { PrismaClient } from '@prisma/client';
import { caminhoLegado, parseRegistro } from './parse-dat';
import { LAYOUT_PCPA70C } from './layouts/pcpa70c';
import { LAYOUT_PCPA129I } from './layouts/pcpa129i';
import {
  INDEXED_PCPA70C,
  INDEXED_PCPA129I,
  lerRegistrosIndexados,
} from './ler-indexed-dat';
import {
  dataCobol,
  extrairMpsProcesso,
  normalizarProdutoCodigo,
  sanitizarTexto,
} from './migracao-utils';

config({ path: resolve(__dirname, '../.env') });

const prisma = new PrismaClient();

/** Extrai até 20 MPs do bloco FR-TAB-20 (8 bytes cada). */
function parseTabMpFerramenta(raw: string) {
  const mps = [];
  const bloco = raw.padEnd(160, ' ');
  for (let i = 0; i < 20; i++) {
    const slice = bloco.slice(i * 8, i * 8 + 8);
    const classeLetra = slice.slice(0, 1).trim() || ' ';
    const classeNumero = parseInt(slice.slice(1, 3), 10) || 0;
    const itemCodigo = parseInt(slice.slice(3, 8), 10) || 0;
    if (classeLetra === ' ' && classeNumero === 0 && itemCodigo === 0) continue;
    mps.push({ classeLetra, classeNumero, itemCodigo });
  }
  return mps.length ? mps : null;
}

/**
 * Extrai relacionamentos do bloco FR-TAB-16 (20 bytes cada):
 * equipamento (6) + RG máquina (4) + produto (10).
 */
function parseTabRelFerramenta(raw: string) {
  const rels = [];
  const bloco = raw.padEnd(320, ' ');
  for (let i = 0; i < 16; i++) {
    const slice = bloco.slice(i * 20, i * 20 + 20);
    const eqGrupo = parseInt(slice.slice(0, 2), 10) || 0;
    const eqCodigo = parseInt(slice.slice(2, 6), 10) || 0;
    const rgMaq = parseInt(slice.slice(6, 10), 10) || 0;
    const prGrupo = parseInt(slice.slice(10, 13), 10) || 0;
    const prClass = parseInt(slice.slice(13, 15), 10) || 0;
    const prItem = parseInt(slice.slice(15, 20), 10) || 0;
    if (
      eqGrupo === 0 &&
      eqCodigo === 0 &&
      rgMaq === 0 &&
      prGrupo === 0 &&
      prItem === 0
    ) {
      continue;
    }
    rels.push({
      equipamentoGrupo: eqGrupo,
      equipamentoCodigo: eqCodigo,
      rgMaquina: rgMaq,
      produtoGrupo: prGrupo,
      produtoClassificacao: prClass,
      produtoItem: prItem,
    });
  }
  return rels.length ? rels : null;
}

async function migrarComplementoProcesso() {
  const caminho = caminhoLegado('PCPA70C.DAT');
  const registros = lerRegistrosIndexados(caminho, INDEXED_PCPA70C);

  let ok = 0;
  let criados = 0;
  let ignorados = 0;
  let erros = 0;

  console.log('Gravando complemento de processo (PCPA70C)...');

  for (const buf of registros) {
    const r = parseRegistro(buf, LAYOUT_PCPA70C);
    const produtoCodigo = normalizarProdutoCodigo(String(r.produto));
    if (!produtoCodigo) {
      ignorados++;
      continue;
    }

    const mps = extrairMpsProcesso(r);
    if (!mps?.length) {
      ignorados++;
      continue;
    }

    try {
      const existente = await prisma.processoProdutivo.findUnique({
        where: { produtoCodigo },
      });

      if (existente) {
        await prisma.processoProdutivo.update({
          where: { produtoCodigo },
          data: { materiasPrimasComplemento: mps },
        });
      } else {
        // Processo só existia no complemento — cria cabeçalho mínimo
        await prisma.processoProdutivo.create({
          data: {
            produtoCodigo,
            materiasPrimasComplemento: mps,
          },
        });
        criados++;
      }
      ok++;
    } catch (e) {
      erros++;
      if (erros <= 3) console.error('Erro PCPA70C:', produtoCodigo, e);
    }
  }

  await prisma.migracaoLog.create({
    data: {
      arquivoOrigem: 'PCPA70C.DAT',
      registrosLidos: registros.length,
      registrosOk: ok,
      registrosErro: erros,
      mensagem: `${ignorados} vazios ignorados; ${criados} processos criados só pelo complemento`,
    },
  });

  console.log(
    `✓ Complemento processo: ${ok} OK (${criados} novos), ${erros} erros, ${ignorados} ignorados (${registros.length} lidos)`,
  );
}

async function migrarFerramentas() {
  const caminho = caminhoLegado('PCPA129I.DAT');
  const registros = lerRegistrosIndexados(caminho, INDEXED_PCPA129I);

  let ok = 0;
  let ignorados = 0;
  let erros = 0;

  console.log('Gravando ferramentas (PCPA129I)...');

  for (const buf of registros) {
    const r = parseRegistro(buf, LAYOUT_PCPA129I);

    // Fábrica pode ser "*", "F", "D", espaço — preservamos 1 char
    let fabrica = String(r.fabrica ?? '');
    if (!fabrica) fabrica = ' ';
    fabrica = fabrica.slice(0, 1);

    const numero = sanitizarTexto(String(r.numero));
    const matricula = (r.matricula as number) || 0;
    const descricao = sanitizarTexto(String(r.descricao)) || null;

    // Sem número = slot inútil
    if (!numero) {
      ignorados++;
      continue;
    }

    const cavidade = (r.cavidade as number) || null;
    const sufixo = sanitizarTexto(String(r.sufixo)) || null;
    const checkList = sanitizarTexto(String(r.checkList)) || null;
    const limiteAfiacao = (r.limiteAfiacao as number) || null;
    const acumGolpes = (r.acumGolpes as number) || null;
    const plContNr = (r.plContNr as number) || null;
    const dataInicio = dataCobol(
      r.anoIni as number,
      r.mesIni as number,
      r.diaIni as number,
    );
    const dataFim = dataCobol(
      r.anoFin as number,
      r.mesFin as number,
      r.diaFin as number,
    );
    const materiasPrimas = parseTabMpFerramenta(String(r.tabMp));
    const relacionamentos = parseTabRelFerramenta(String(r.tabRel));

    try {
      await prisma.ferramenta.upsert({
        where: {
          fabrica_numero_matricula: { fabrica, numero, matricula },
        },
        create: {
          fabrica,
          numero,
          matricula,
          cavidade,
          sufixo,
          descricao,
          checkList,
          limiteAfiacao,
          acumGolpes,
          dataInicio,
          dataFim,
          plContNr,
          materiasPrimas: materiasPrimas ?? undefined,
          relacionamentos: relacionamentos ?? undefined,
        },
        update: {
          cavidade,
          sufixo,
          descricao,
          checkList,
          limiteAfiacao,
          acumGolpes,
          dataInicio,
          dataFim,
          plContNr,
          materiasPrimas: materiasPrimas ?? undefined,
          relacionamentos: relacionamentos ?? undefined,
        },
      });
      ok++;
    } catch (e) {
      erros++;
      if (erros <= 5) {
        console.error('Erro ferramenta:', fabrica, numero, matricula, e);
      }
    }
  }

  await prisma.migracaoLog.create({
    data: {
      arquivoOrigem: 'PCPA129I.DAT',
      registrosLidos: registros.length,
      registrosOk: ok,
      registrosErro: erros,
      mensagem: `${ignorados} sem número ignorados`,
    },
  });

  console.log(
    `✓ Ferramentas: ${ok} gravadas, ${erros} erros, ${ignorados} ignoradas (${registros.length} lidos)`,
  );
}

async function main() {
  console.log('Migração Pacote B — complemento processo + ferramentas');
  console.log('Origem:', process.env.LEGACY_DATA_PATH);
  console.log('---');

  await migrarComplementoProcesso();
  await migrarFerramentas();

  console.log('---');
  console.log('Pacote B concluído.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
