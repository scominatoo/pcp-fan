import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { paginateParams, paginated } from '../common/pagination';
import { formatarCodigoMateriaPrima } from '../materia-prima/materia-prima.serializer';
import { formatarCodigoProduto } from '../produtos/produtos.serializer';
import { PrismaService } from '../prisma/prisma.service';
import {
  RelatorioMpEstoqueQueryDto,
  RelatorioPeriodoQueryDto,
  RelatorioProgramacaoQueryDto,
  RelatorioSetorQueryDto,
} from './dto/relatorio-query.dto';

@Injectable()
export class RelatoriosService {
  constructor(private readonly prisma: PrismaService) {}

  /** PC1078 — OP em aberto por período de abertura. */
  async opAbertas(query: RelatorioPeriodoQueryDto) {
    const { page, limit, skip, take } = paginateParams({
      ...query,
      limit: Math.min(query.limit ?? 50, 200),
    });
    const where = this.filtroOpPeriodo(query, false);

    const [rows, total] = await Promise.all([
      this.prisma.ordemProducao.findMany({
        where,
        skip,
        take,
        orderBy: { codigo: 'asc' },
        include: {
          produto: { include: { grupo: true, classificacao: true } },
        },
      }),
      this.prisma.ordemProducao.count({ where }),
    ]);

    const itens = rows.map((op) => ({
      codigo: op.codigo,
      produtoCodigo: op.produtoCodigo,
      produtoDescricao: op.produto?.descricao ?? null,
      produtoCodigoFormatado: op.produto
        ? formatarCodigoProduto(op.produto)
        : null,
      quantidade: op.quantidade,
      dataAbertura: op.dataAbertura,
      horaAbertura: op.horaAbertura,
      tipo: op.tipo,
      clienteNome: op.clienteNome,
      baixadaMp: op.baixadaMp,
      baixadaProduto: op.baixadaProduto,
    }));

    return {
      titulo: 'OP em aberto',
      referencia: 'PC1078',
      ...paginated(itens, total, page, limit),
      totais: {
        quantidadeOps: total,
        pecasProgramadas: itens.reduce((s, o) => s + o.quantidade, 0),
      },
    };
  }

  /** PC1071 — OP baixadas com dados consolidados. */
  async opBaixadas(query: RelatorioPeriodoQueryDto) {
    const { page, limit, skip, take } = paginateParams({
      ...query,
      limit: Math.min(query.limit ?? 50, 200),
    });
    const where = this.filtroOpPeriodo(query, true);

    const [rows, total] = await Promise.all([
      this.prisma.ordemProducao.findMany({
        where,
        skip,
        take,
        orderBy: { codigo: 'desc' },
        include: {
          produto: { include: { grupo: true, classificacao: true } },
          baixaConsolidada: true,
        },
      }),
      this.prisma.ordemProducao.count({ where }),
    ]);

    const itens = rows.map((op) => ({
      codigo: op.codigo,
      produtoCodigo: op.produtoCodigo,
      produtoDescricao: op.produto?.descricao ?? null,
      produtoCodigoFormatado: op.produto
        ? formatarCodigoProduto(op.produto)
        : null,
      quantidade: op.quantidade,
      dataAbertura: op.dataAbertura,
      tipo: op.tipo,
      clienteNome: op.clienteNome,
      baixadaMp: op.baixadaMp,
      baixadaProduto: op.baixadaProduto,
      baixa: op.baixaConsolidada
        ? {
            dataBaixa: op.baixaConsolidada.dataBaixa,
            horaBaixa: op.baixaConsolidada.horaBaixa,
            pecasProduzidas: op.baixaConsolidada.pecasProduzidas,
            mpConsumida: op.baixaConsolidada.mpConsumida,
            rolos: op.baixaConsolidada.rolos,
          }
        : null,
    }));

    return {
      titulo: 'OP baixadas',
      referencia: 'PC1071',
      ...paginated(itens, total, page, limit),
      totais: {
        quantidadeOps: total,
        pecasProduzidas: itens.reduce(
          (s, o) => s + (o.baixa?.pecasProduzidas ?? 0),
          0,
        ),
      },
    };
  }

  /** PC1135 — produção por setor (soma baixas de operação). */
  async producaoSetor(query: RelatorioSetorQueryDto) {
    const dataInicio = query.dataInicio
      ? new Date(query.dataInicio)
      : undefined;
    const dataFim = query.dataFim ? new Date(query.dataFim) : undefined;

    const [baixas, operacoesProcesso, secoes] = await Promise.all([
      this.prisma.ordemProducaoBaixaOperacao.findMany({
        where: {
          ...(dataInicio || dataFim
            ? {
                dataFim: {
                  ...(dataInicio ? { gte: dataInicio } : {}),
                  ...(dataFim ? { lte: dataFim } : {}),
                },
              }
            : {}),
        },
        include: {
          ordemProducao: {
            select: { codigo: true, produtoCodigo: true },
          },
        },
      }),
      this.prisma.processoOperacao.findMany({
        where: { secaoCodigo: { not: null } },
        include: { processo: { select: { produtoCodigo: true } } },
      }),
      this.prisma.secao.findMany(),
    ]);

    const secaoPorOperacao = new Map<string, number>();
    for (const op of operacoesProcesso) {
      if (op.secaoCodigo == null) continue;
      secaoPorOperacao.set(
        `${op.processo.produtoCodigo}-${op.numeroOperacao}`,
        op.secaoCodigo,
      );
    }

    const secaoMap = new Map(secoes.map((s) => [s.codigo, s.descricao]));

    const acumulo = new Map<
      number,
      { secaoCodigo: number; qtdeProduzida: number; operacoes: number }
    >();

    for (const baixa of baixas) {
      const secaoCodigo = secaoPorOperacao.get(
        `${baixa.ordemProducao.produtoCodigo}-${baixa.numeroOperacao}`,
      );
      if (!secaoCodigo) continue;
      if (query.secaoCodigo && secaoCodigo !== query.secaoCodigo) continue;

      const atual = acumulo.get(secaoCodigo) ?? {
        secaoCodigo,
        qtdeProduzida: 0,
        operacoes: 0,
      };
      atual.qtdeProduzida += baixa.qtdeSaida;
      atual.operacoes += 1;
      acumulo.set(secaoCodigo, atual);
    }

    const itens = [...acumulo.values()]
      .sort((a, b) => a.secaoCodigo - b.secaoCodigo)
      .map((item) => ({
        secaoCodigo: item.secaoCodigo,
        secaoDescricao: secaoMap.get(item.secaoCodigo) ?? null,
        qtdeProduzida: item.qtdeProduzida,
        operacoesBaixadas: item.operacoes,
      }));

    const totalQtde = itens.reduce((s, i) => s + i.qtdeProduzida, 0);

    return {
      titulo: 'Produção por setor',
      referencia: 'PC1135',
      itens,
      totais: {
        setores: itens.length,
        qtdeProduzida: totalQtde,
        operacoesBaixadas: itens.reduce((s, i) => s + i.operacoesBaixadas, 0),
      },
    };
  }

  /** PC1059 — MP abaixo do mínimo ou acima do máximo. */
  async mpEstoqueCritico(query: RelatorioMpEstoqueQueryDto) {
    const { page, limit, skip, take } = paginateParams({
      ...query,
      limit: Math.min(query.limit ?? 50, 200),
    });
    const tipo = query.tipo ?? 'ambos';

    const todas = await this.prisma.materiaPrima.findMany({
      orderBy: [{ classeLetra: 'asc' }, { classeNumero: 'asc' }, { itemCodigo: 'asc' }],
    });

    const filtradas = todas.filter((mp) => {
      const qtd = mp.quantidade ? Number(mp.quantidade) : 0;
      const min = mp.estoqueMin ? Number(mp.estoqueMin) : 0;
      const max = mp.estoqueMax ? Number(mp.estoqueMax) : 0;
      const abaixoMin = min > 0 && qtd < min;
      const acimaMax = max > 0 && qtd > max;
      if (tipo === 'minimo') return abaixoMin;
      if (tipo === 'maximo') return acimaMax;
      return abaixoMin || acimaMax;
    });

    const slice = filtradas.slice(skip, skip + take);
    const itens = slice.map((mp) => {
      const qtd = mp.quantidade ? Number(mp.quantidade) : 0;
      const min = mp.estoqueMin ? Number(mp.estoqueMin) : 0;
      const max = mp.estoqueMax ? Number(mp.estoqueMax) : 0;
      let situacao: 'abaixo_minimo' | 'acima_maximo' = 'abaixo_minimo';
      if (max > 0 && qtd > max) situacao = 'acima_maximo';
      return {
        id: mp.id,
        codigo: formatarCodigoMateriaPrima(mp),
        descricao: mp.descricao,
        unidade: mp.unidade,
        quantidade: qtd,
        estoqueMin: min || null,
        estoqueMax: max || null,
        diferenca:
          situacao === 'abaixo_minimo' && min > 0
            ? min - qtd
            : situacao === 'acima_maximo' && max > 0
              ? qtd - max
              : 0,
        situacao,
      };
    });

    return {
      titulo: 'Estoque MP crítico (mín/máx)',
      referencia: 'PC1059',
      tipo,
      ...paginated(itens, filtradas.length, page, limit),
      totais: {
        abaixoMinimo: filtradas.filter((mp) => {
          const qtd = mp.quantidade ? Number(mp.quantidade) : 0;
          const min = mp.estoqueMin ? Number(mp.estoqueMin) : 0;
          return min > 0 && qtd < min;
        }).length,
        acimaMaximo: filtradas.filter((mp) => {
          const qtd = mp.quantidade ? Number(mp.quantidade) : 0;
          const max = mp.estoqueMax ? Number(mp.estoqueMax) : 0;
          return max > 0 && qtd > max;
        }).length,
      },
    };
  }

  /** Sintético de programação por mês. */
  async programacaoSintetico(query: RelatorioProgramacaoQueryDto) {
    const where: Prisma.ProgramacaoEntregaWhereInput = {};
    if (query.dataInicio) {
      where.dataProgramacao = { gte: new Date(query.dataInicio) };
    }
    if (query.dataFim) {
      where.dataProgramacao = {
        ...(where.dataProgramacao as Prisma.DateTimeFilter),
        lte: new Date(query.dataFim),
      };
    }

    const rows = await this.prisma.programacaoEntrega.findMany({
      where,
      orderBy: { dataProgramacao: 'asc' },
    });

    const porMes = new Map<
      string,
      {
        mes: string;
        registros: number;
        programado: number;
        entregue: number;
        aProduzir: number;
      }
    >();

    for (const r of rows) {
      const d = r.dataProgramacao;
      const chave = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
      const atual = porMes.get(chave) ?? {
        mes: chave,
        registros: 0,
        programado: 0,
        entregue: 0,
        aProduzir: 0,
      };
      atual.registros += 1;
      atual.programado += r.quantidade;
      atual.entregue += r.qtdeEntregue;
      atual.aProduzir += r.qtdeAProduzir;
      porMes.set(chave, atual);
    }

    const itens = [...porMes.values()].sort((a, b) =>
      a.mes.localeCompare(b.mes),
    );

    return {
      titulo: 'Programação sintética por mês',
      referencia: 'PC1067/PC1098',
      itens,
      totais: {
        meses: itens.length,
        programado: itens.reduce((s, i) => s + i.programado, 0),
        entregue: itens.reduce((s, i) => s + i.entregue, 0),
        aProduzir: itens.reduce((s, i) => s + i.aProduzir, 0),
      },
    };
  }

  private filtroOpPeriodo(
    query: RelatorioPeriodoQueryDto,
    baixada: boolean,
  ): Prisma.OrdemProducaoWhereInput {
    const and: Prisma.OrdemProducaoWhereInput[] = [{ baixada }];

    if (query.dataInicio) {
      and.push({ dataAbertura: { gte: new Date(query.dataInicio) } });
    }
    if (query.dataFim) {
      and.push({ dataAbertura: { lte: new Date(query.dataFim) } });
    }
    if (query.codigoOpInicio != null) {
      and.push({ codigo: { gte: query.codigoOpInicio } });
    }
    if (query.codigoOpFim != null) {
      and.push({ codigo: { lte: query.codigoOpFim } });
    }

    return { AND: and };
  }
}
