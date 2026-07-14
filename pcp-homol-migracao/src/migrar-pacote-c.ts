/**
 * Migração — Pacote C: enriquecer MP + clientes
 *
 *   1. PCPA22II — descrições longas e preço de compra da MP
 *   2. PCPA22B  — desenho do cliente + textos/embalagens extras
 *   3. PCPA04I  — cadastro de clientes (referência)
 *
 * Uso: npm run migrar:pacote-c
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { PrismaClient } from '@prisma/client';
import { caminhoLegado, parseRegistro, validarLayout } from './parse-dat';
import { LAYOUT_PCPA22II } from './layouts/pcpa22ii';
import { LAYOUT_PCPA22B } from './layouts/pcpa22b';
import { LAYOUT_PCPA04I } from './layouts/pcpa04i';
import {
  INDEXED_PCPA22II,
  INDEXED_PCPA22B,
  INDEXED_PCPA04I,
  lerRegistrosIndexados,
} from './ler-indexed-dat';
import { sanitizarTexto } from './migracao-utils';

config({ path: resolve(__dirname, '../.env') });

const prisma = new PrismaClient();

/** PIC 9(n)V9(m) DISPLAY → string decimal (ou null se zerado). */
function parseDecimalDisplay(
  raw: string,
  casasDecimais: number,
): string | null {
  const digitos = String(raw ?? '').replace(/\D/g, '');
  if (!digitos || /^0+$/.test(digitos)) return null;
  const padded = digitos.padStart(casasDecimais + 1, '0');
  const intPart = padded.slice(0, -casasDecimais) || '0';
  const decPart = padded.slice(-casasDecimais);
  return `${parseInt(intPart, 10)}.${decPart}`;
}

type MpKey = string;
function chaveMp(letra: string, numero: number, item: number): MpKey {
  return `${letra}|${numero}|${item}`;
}

async function carregarLookupMp() {
  const rows = await prisma.materiaPrima.findMany({
    select: { id: true, classeLetra: true, classeNumero: true, itemCodigo: true },
  });
  const map = new Map<MpKey, number>();
  for (const r of rows) {
    map.set(chaveMp(r.classeLetra, r.classeNumero, r.itemCodigo), r.id);
  }
  return map;
}

async function migrarPcpa22Ii(lookup: Map<MpKey, number>) {
  const caminho = caminhoLegado('PCPA22II.DAT');
  const registros = lerRegistrosIndexados(caminho, INDEXED_PCPA22II);

  let ok = 0;
  let semPai = 0;
  let ignorados = 0;
  let erros = 0;

  console.log('Enriquecendo MP com PCPA22II...');

  for (const buf of registros) {
    const r = parseRegistro(buf, LAYOUT_PCPA22II);
    const classeLetra = sanitizarTexto(String(r.classeLetra)).slice(0, 1);
    const classeNumero = r.classeNumero as number;
    const item = r.item as number;

    if (!classeLetra || (!classeNumero && !item)) {
      ignorados++;
      continue;
    }

    const id = lookup.get(chaveMp(classeLetra, classeNumero, item));
    if (!id) {
      semPai++;
      continue;
    }

    const descricaoCompl1 = sanitizarTexto(String(r.descricao1)) || null;
    const descricaoCompl2 = sanitizarTexto(String(r.descricao2)) || null;
    const precoCompra = parseDecimalDisplay(String(r.precoCompra), 3);

    try {
      await prisma.materiaPrima.update({
        where: { id },
        data: {
          descricaoCompl1,
          descricaoCompl2,
          precoCompra,
        },
      });
      ok++;
    } catch (e) {
      erros++;
      if (erros <= 3) console.error('Erro 22II:', classeLetra, item, e);
    }
  }

  await prisma.migracaoLog.create({
    data: {
      arquivoOrigem: 'PCPA22II.DAT',
      registrosLidos: registros.length,
      registrosOk: ok,
      registrosErro: erros,
      mensagem: `${ignorados} vazios; ${semPai} sem MP pai`,
    },
  });

  console.log(
    `✓ PCPA22II: ${ok} atualizados, ${semPai} sem pai, ${erros} erros (${registros.length} lidos)`,
  );
}

async function migrarPcpa22B(lookup: Map<MpKey, number>) {
  const caminho = caminhoLegado('PCPA22B.DAT');
  const registros = lerRegistrosIndexados(caminho, INDEXED_PCPA22B);

  let ok = 0;
  let semPai = 0;
  let ignorados = 0;
  let erros = 0;

  console.log('Enriquecendo MP com PCPA22B...');

  for (const buf of registros) {
    const r = parseRegistro(buf, LAYOUT_PCPA22B);
    const classeLetra = sanitizarTexto(String(r.classeLetra)).slice(0, 1);
    const classeNumero = r.classeNumero as number;
    const item = r.item as number;

    if (!classeLetra) {
      ignorados++;
      continue;
    }

    const id = lookup.get(chaveMp(classeLetra, classeNumero, item));
    if (!id) {
      semPai++;
      continue;
    }

    const desenhoCliente = sanitizarTexto(String(r.desenhoCliente)) || null;
    const complementoExtra = {
      descricao3: sanitizarTexto(String(r.descricao3)) || null,
      descricao4: sanitizarTexto(String(r.descricao4)) || null,
      descricao5: sanitizarTexto(String(r.descricao5)) || null,
      descricao6: sanitizarTexto(String(r.descricao6)) || null,
      embalagem1: sanitizarTexto(String(r.embalagem1)) || null,
      embalagem2: sanitizarTexto(String(r.embalagem2)) || null,
      embalagem3: sanitizarTexto(String(r.embalagem3)) || null,
      embalagem4: sanitizarTexto(String(r.embalagem4)) || null,
      embalagem5: sanitizarTexto(String(r.embalagem5)) || null,
      embalagem6: sanitizarTexto(String(r.embalagem6)) || null,
    };

    // Se tudo vazio, ainda marca update se houver desenho
    const temExtra = Object.values(complementoExtra).some((v) => !!v);

    try {
      await prisma.materiaPrima.update({
        where: { id },
        data: {
          desenhoCliente,
          complementoExtra: temExtra ? complementoExtra : undefined,
        },
      });
      ok++;
    } catch (e) {
      erros++;
      if (erros <= 3) console.error('Erro 22B:', classeLetra, item, e);
    }
  }

  await prisma.migracaoLog.create({
    data: {
      arquivoOrigem: 'PCPA22B.DAT',
      registrosLidos: registros.length,
      registrosOk: ok,
      registrosErro: erros,
      mensagem: `${ignorados} vazios; ${semPai} sem MP pai`,
    },
  });

  console.log(
    `✓ PCPA22B: ${ok} atualizados, ${semPai} sem pai, ${erros} erros (${registros.length} lidos)`,
  );
}

async function migrarClientes() {
  const caminho = caminhoLegado('PCPA04I.DAT');
  const registros = lerRegistrosIndexados(caminho, INDEXED_PCPA04I);

  let ok = 0;
  let ignorados = 0;
  let erros = 0;

  console.log('Gravando clientes (PCPA04I)...');

  for (const buf of registros) {
    const r = parseRegistro(buf, LAYOUT_PCPA04I);
    const codigo = r.codigo as number;
    const empresa = sanitizarTexto(String(r.empresa));

    if (!codigo || !empresa) {
      ignorados++;
      continue;
    }

    const cep1 = sanitizarTexto(String(r.cep1));
    const cep2 = sanitizarTexto(String(r.cep2));
    const cep = cep1 || cep2 ? `${cep1}${cep2}` : null;

    try {
      await prisma.cliente.upsert({
        where: { codigo },
        create: {
          codigo,
          empresa,
          sufixo: sanitizarTexto(String(r.sufixo)) || null,
          endereco: sanitizarTexto(String(r.endereco)) || null,
          enderecoCobranca: sanitizarTexto(String(r.enderecoCobranca)) || null,
          cidade: sanitizarTexto(String(r.cidade)) || null,
          estado: sanitizarTexto(String(r.estado)) || null,
          cep,
          bairro: sanitizarTexto(String(r.bairro)) || null,
          telefone1: sanitizarTexto(String(r.telefone1)) || null,
          telefone2: sanitizarTexto(String(r.telefone2)) || null,
          ddd: (r.ddd as number) || null,
          cgc: sanitizarTexto(String(r.cgc)) || null,
          inscricaoEstadual: sanitizarTexto(String(r.inscricao)) || null,
          ccm: sanitizarTexto(String(r.ccm)) || null,
          contato1: sanitizarTexto(String(r.contato1)) || null,
          contato2: sanitizarTexto(String(r.contato2)) || null,
          fax: sanitizarTexto(String(r.fax)) || null,
          tipo: sanitizarTexto(String(r.tipo)) || null,
          vendedorCodigo: (r.vendedor as number) || null,
          enderecoEntrega: sanitizarTexto(String(r.entrega)) || null,
        },
        update: {
          empresa,
          sufixo: sanitizarTexto(String(r.sufixo)) || null,
          endereco: sanitizarTexto(String(r.endereco)) || null,
          enderecoCobranca: sanitizarTexto(String(r.enderecoCobranca)) || null,
          cidade: sanitizarTexto(String(r.cidade)) || null,
          estado: sanitizarTexto(String(r.estado)) || null,
          cep,
          bairro: sanitizarTexto(String(r.bairro)) || null,
          telefone1: sanitizarTexto(String(r.telefone1)) || null,
          telefone2: sanitizarTexto(String(r.telefone2)) || null,
          ddd: (r.ddd as number) || null,
          cgc: sanitizarTexto(String(r.cgc)) || null,
          inscricaoEstadual: sanitizarTexto(String(r.inscricao)) || null,
          ccm: sanitizarTexto(String(r.ccm)) || null,
          contato1: sanitizarTexto(String(r.contato1)) || null,
          contato2: sanitizarTexto(String(r.contato2)) || null,
          fax: sanitizarTexto(String(r.fax)) || null,
          tipo: sanitizarTexto(String(r.tipo)) || null,
          vendedorCodigo: (r.vendedor as number) || null,
          enderecoEntrega: sanitizarTexto(String(r.entrega)) || null,
        },
      });
      ok++;
    } catch (e) {
      erros++;
      if (erros <= 3) console.error('Erro cliente:', codigo, e);
    }
  }

  await prisma.migracaoLog.create({
    data: {
      arquivoOrigem: 'PCPA04I.DAT',
      registrosLidos: registros.length,
      registrosOk: ok,
      registrosErro: erros,
      mensagem: `${ignorados} sem código/empresa ignorados`,
    },
  });

  console.log(
    `✓ Clientes: ${ok} gravados, ${erros} erros, ${ignorados} ignorados (${registros.length} lidos)`,
  );
}

async function main() {
  console.log('Migração Pacote C — complemento MP + clientes');
  console.log('Origem:', process.env.LEGACY_DATA_PATH);
  console.log('---');

  validarLayout(LAYOUT_PCPA22II);
  validarLayout(LAYOUT_PCPA22B);
  validarLayout(LAYOUT_PCPA04I);

  const lookup = await carregarLookupMp();
  console.log(`Lookup MP: ${lookup.size} cadastradas`);

  await migrarPcpa22Ii(lookup);
  await migrarPcpa22B(lookup);
  await migrarClientes();

  console.log('---');
  console.log('Pacote C concluído.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
