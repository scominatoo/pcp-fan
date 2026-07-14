import { Injectable, NotFoundException } from '@nestjs/common';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { paginateParams, paginated } from '../common/pagination';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Consulta dos processos produtivos migrados do PC1070 (PCPA70I / PCPA70XI).
 * Por enquanto só leitura — cadastro/edição ficam para depois do aceite FANANDRI.
 */
@Injectable()
export class ProcessosService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: PaginationQueryDto) {
    const { page, limit, skip, take } = paginateParams(query);
    const termo = query.search?.trim();

    // Busca por código do desenho OU descrição do produto vinculado
    const where = termo
      ? {
          OR: [
            {
              produtoCodigo: {
                contains: termo,
                mode: 'insensitive' as const,
              },
            },
            {
              produto: {
                descricao: {
                  contains: termo,
                  mode: 'insensitive' as const,
                },
              },
            },
            {
              produto: {
                desenhoCliente: {
                  contains: termo,
                  mode: 'insensitive' as const,
                },
              },
            },
          ],
        }
      : {};

    const [rows, total] = await Promise.all([
      this.prisma.processoProdutivo.findMany({
        where,
        skip,
        take,
        // Prioriza roteiros com operações (mais úteis na homologação)
        orderBy: [
          { operacoes: { _count: 'desc' } },
          { produtoCodigo: 'asc' },
        ],
        include: {
          produto: {
            select: {
              id: true,
              descricao: true,
              desenhoCliente: true,
              desenhoSparta: true,
            },
          },
          _count: { select: { operacoes: true } },
        },
      }),
      this.prisma.processoProdutivo.count({ where }),
    ]);

    const data = rows.map((p) => ({
      id: p.id,
      produtoCodigo: p.produtoCodigo,
      pesoBruto: p.pesoBruto,
      pesoLiquido: p.pesoLiquido,
      qtdeOp: p.qtdeOp,
      producaoHr: p.producaoHr,
      produtoId: p.produtoId,
      produtoDescricao: p.produto?.descricao ?? null,
      desenhoCliente: p.produto?.desenhoCliente ?? p.produtoCodigo,
      desenhoSparta: p.produto?.desenhoSparta ?? null,
      qtdeOperacoes: p._count.operacoes,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    }));

    return paginated(data, total, page, limit);
  }

  async findOne(id: number) {
    const processo = await this.prisma.processoProdutivo.findUnique({
      where: { id },
      include: {
        produto: {
          select: {
            id: true,
            descricao: true,
            desenhoCliente: true,
            desenhoSparta: true,
            grupoCodigo: true,
            classificacaoCodigo: true,
            itemCodigo: true,
          },
        },
        operacoes: { orderBy: { numeroOperacao: 'asc' } },
      },
    });

    if (!processo) {
      throw new NotFoundException(`Processo ${id} não encontrado`);
    }

    return {
      id: processo.id,
      produtoCodigo: processo.produtoCodigo,
      pesoBruto: processo.pesoBruto,
      pesoLiquido: processo.pesoLiquido,
      qtdeOp: processo.qtdeOp,
      producaoHr: processo.producaoHr,
      materiasPrimas: processo.materiasPrimas,
      materiasPrimasComplemento: processo.materiasPrimasComplemento,
      produto: processo.produto,
      operacoes: processo.operacoes.map((op) => ({
        id: op.id,
        numeroOperacao: op.numeroOperacao,
        descricao: op.descricao,
        observacao1: op.observacao1,
        observacao2: op.observacao2,
        plano: op.plano,
        secaoCodigo: op.secaoCodigo,
        preparacaoSegundos: op.preparacaoSegundos,
        producaoSegundos: op.producaoSegundos,
        cacamba: op.cacamba,
        pecas: op.pecas,
        equipamentoEscolhido: op.equipamentoEscolhido,
        equipamentosTab: op.equipamentosTab,
      })),
    };
  }
}
