/**
 * Migração — ordens de produção (PCPA28I + PCPA28II + PCPA28E)
 *
 * Uso: npm run migrar:ops
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { Prisma, PrismaClient } from '@prisma/client';
import { caminhoLegado, parseRegistro } from './parse-dat';
import { LAYOUT_PCPA28I } from './layouts/pcpa28i';
import { LAYOUT_PCPA28II } from './layouts/pcpa28ii';
import { LAYOUT_PCPA28E } from './layouts/pcpa28e';
import {
  INDEXED_PCPA28E,
  INDEXED_PCPA28I,
  INDEXED_PCPA28II,
  lerRegistrosIndexados,
} from './ler-indexed-dat';
import {
  chaveProdutoCompacta,
  dataCobol,
  flagSn,
  horaCobol,
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

/** Executa upserts em lotes dentro de transações (desempenho). */
async function executarEmLotes<T>(
  itens: T[],
  tamanho: number,
  fn: (item: T) => Prisma.PrismaPromise<unknown>,
  rotulo: string,
) {
  let ok = 0;
  let erros = 0;
  for (let i = 0; i < itens.length; i += tamanho) {
    const lote = itens.slice(i, i + tamanho);
    try {
      await prisma.$transaction(lote.map(fn));
      ok += lote.length;
    } catch (e) {
      erros += lote.length;
      if (erros <= tamanho) console.error(`Erro lote ${rotulo}:`, e);
    }
    if ((i / tamanho) % 20 === 0 && i > 0) console.log(`  ... ${ok} ${rotulo}`);
  }
  return { ok, erros };
}

/**
 * Carga incremental: cria OPs novas e atualiza as existentes pelo código.
 * Não apaga nada — baixas e requisições lançadas no sistema novo ficam
 * ligadas às OPs (FK com cascade).
 */
async function migrarOps(lookup: LookupProduto) {
  const caminho = caminhoLegado('PCPA28I.DAT');
  const registros = lerRegistrosIndexados(caminho, INDEXED_PCPA28I);

  const antes = await prisma.ordemProducao.count();
  const dados: Prisma.OrdemProducaoCreateInput[] = [];
  const codigosVistos = new Set<number>();

  for (const buf of registros) {
    const r = parseRegistro(buf, LAYOUT_PCPA28I);
    const codigo = r.codigo as number;
    if (codigo === 0 || codigosVistos.has(codigo)) continue;
    codigosVistos.add(codigo);

    const produtoCodigo = normalizarProdutoCodigo(String(r.produto));
    const produtoId = resolverProdutoId(produtoCodigo, lookup);

    dados.push({
      codigo,
      produtoCodigo,
      ...(produtoId ? { produto: { connect: { id: produtoId } } } : {}),
      quantidade: (r.quantidade as number) || 0,
      dataAbertura: dataCobol(
        r.ano as number,
        r.mes as number,
        r.dia as number,
      ),
      horaAbertura: horaCobol(
        r.hora as number,
        r.minuto as number,
        r.segundo as number,
      ),
      baixada: flagSn(String(r.baixada)),
      baixadaMp: flagSn(String(r.baixadaMp)),
      baixadaProduto: flagSn(String(r.baixadaProduto)),
      tipoProc: sanitizarTexto(String(r.tipoProc)) || null,
      tipo: sanitizarTexto(String(r.tipo)) || null,
    });
  }

  console.log(`Gravando ${dados.length} cabeçalhos de OP (upsert)...`);
  const { ok, erros } = await executarEmLotes(
    dados,
    500,
    (d) => {
      const { codigo, produto, ...resto } = d;
      return prisma.ordemProducao.upsert({
        where: { codigo },
        create: d,
        update: {
          ...resto,
          ...(produto ? { produto } : {}),
        },
      });
    },
    'OPs',
  );

  const opPorCodigo = new Map<number, number>();
  const ops = await prisma.ordemProducao.findMany({
    select: { id: true, codigo: true },
  });
  for (const op of ops) opPorCodigo.set(op.codigo, op.id);
  const novas = ops.length - antes;

  await prisma.migracaoLog.create({
    data: {
      arquivoOrigem: 'PCPA28I.DAT',
      registrosLidos: registros.length,
      registrosOk: ok,
      registrosErro: erros,
      mensagem: `incremental: ${novas} OPs novas`,
    },
  });

  console.log(`✓ OPs: ${ok} gravadas (${novas} novas), ${erros} erros`);
  return opPorCodigo;
}

async function migrarComplementoOps() {
  const caminho = caminhoLegado('PCPA28II.DAT');
  const registros = lerRegistrosIndexados(caminho, INDEXED_PCPA28II);

  let ok = 0;
  let erros = 0;
  let ignorados = 0;

  for (const buf of registros) {
    const r = parseRegistro(buf, LAYOUT_PCPA28II);
    const codigo = r.codigo as number;
    const cliente = String(r.cliente).trim();
    if (codigo === 0 || !cliente) {
      ignorados++;
      continue;
    }

    try {
      await prisma.ordemProducao.update({
        where: { codigo },
        data: { clienteNome: sanitizarTexto(cliente) },
      });
      ok++;
    } catch {
      ignorados++;
    }
  }

  await prisma.migracaoLog.create({
    data: {
      arquivoOrigem: 'PCPA28II.DAT',
      registrosLidos: registros.length,
      registrosOk: ok,
      registrosErro: erros,
      mensagem: `${ignorados} sem OP pai ou cliente vazio`,
    },
  });

  console.log(
    `✓ Complemento OP (cliente): ${ok} atualizados, ${ignorados} ignorados`,
  );
}

async function migrarOperacoesOp(opPorCodigo: Map<number, number>) {
  const caminho = caminhoLegado('PCPA28E.DAT');
  const registros = lerRegistrosIndexados(caminho, INDEXED_PCPA28E);

  let ignorados = 0;
  const dados: Prisma.OrdemProducaoOperacaoUncheckedCreateInput[] = [];
  const chavesVistas = new Set<string>();

  for (const buf of registros) {
    const r = parseRegistro(buf, LAYOUT_PCPA28E);
    const codigoOp = r.codigoOp as number;
    const numeroOperacao = r.numeroOperacao as number;

    const ordemProducaoId = opPorCodigo.get(codigoOp);
    if (codigoOp === 0 || numeroOperacao === 0 || !ordemProducaoId) {
      ignorados++;
      continue;
    }
    const chave = `${ordemProducaoId}-${numeroOperacao}`;
    if (chavesVistas.has(chave)) continue;
    chavesVistas.add(chave);

    dados.push({
      ordemProducaoId,
      numeroOperacao,
      equipamentoGrupo: (r.equipamentoGrupo as number) || null,
      equipamentoCodigo: (r.equipamentoCodigo as number) || null,
      indice: (r.indice as number) || null,
      ferramentaFabrica: sanitizarTexto(String(r.ferramentaFabrica)) || null,
      ferramentaNumero: sanitizarTexto(String(r.ferramentaNumero)) || null,
      ferramentaMatricula: (r.ferramentaMatricula as number) || null,
      dataEncerramento: dataCobol(
        r.anoEncerramento as number,
        r.mesEncerramento as number,
        r.diaEncerramento as number,
      ),
    });
  }

  console.log(`Gravando ${dados.length} operações de OP (upsert)...`);
  const { ok, erros } = await executarEmLotes(
    dados,
    500,
    (d) => {
      const { ordemProducaoId, numeroOperacao, ...resto } = d;
      return prisma.ordemProducaoOperacao.upsert({
        where: {
          ordemProducaoId_numeroOperacao: { ordemProducaoId, numeroOperacao },
        },
        create: d,
        update: resto,
      });
    },
    'operações',
  );

  await prisma.migracaoLog.create({
    data: {
      arquivoOrigem: 'PCPA28E.DAT',
      registrosLidos: registros.length,
      registrosOk: ok,
      registrosErro: erros,
      mensagem: `incremental: ${ignorados} slots vazios ou sem OP pai`,
    },
  });

  console.log(
    `✓ Operações OP: ${ok} gravadas, ${erros} erros, ${ignorados} ignorados`,
  );
}

async function main() {
  console.log('Migração de ordens de produção');
  console.log('Origem:', process.env.LEGACY_DATA_PATH);
  console.log('---');

  const lookup = await carregarLookupProdutos();
  console.log(`Lookup produtos: ${lookup.porChave.size} chaves, ${lookup.porDesenhoCliente.size} desenhos`);
  console.log('---');

  const opPorCodigo = await migrarOps(lookup);
  await migrarComplementoOps();
  await migrarOperacoesOp(opPorCodigo);

  console.log('---');
  console.log('Migração de OPs concluída.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
