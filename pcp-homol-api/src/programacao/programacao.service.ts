import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { paginateParams, paginated } from '../common/pagination';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateProgramacaoDto,
  ProgramacaoQueryDto,
  RegistrarEntregaDto,
  UpdateProgramacaoDto,
} from './dto/programacao.dto';
import { serializeProgramacao } from './programacao.serializer';

@Injectable()
export class ProgramacaoService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: ProgramacaoQueryDto) {
    const { page, limit, skip, take } = paginateParams(query);
    const where = this.buildWhere(query);

    const [rows, total] = await Promise.all([
      this.prisma.programacaoEntrega.findMany({
        where,
        skip,
        take,
        orderBy: [{ dataProgramacao: 'desc' }, { id: 'desc' }],
        include: {
          produto: { include: { grupo: true, classificacao: true } },
        },
      }),
      this.prisma.programacaoEntrega.count({ where }),
    ]);

    return paginated(
      rows.map(serializeProgramacao),
      total,
      page,
      limit,
    );
  }

  async findOne(id: number) {
    const row = await this.carregar(id);
    return serializeProgramacao(row);
  }

  async resumo(query: ProgramacaoQueryDto) {
    const where = this.buildWhere(query);
    const rows = await this.prisma.programacaoEntrega.findMany({ where });

    let programado = 0;
    let entregue = 0;
    let aProduzir = 0;

    for (const r of rows) {
      programado += r.quantidade;
      entregue += r.qtdeEntregue;
      aProduzir += r.qtdeAProduzir;
    }

    return {
      totalRegistros: rows.length,
      quantidadeProgramada: programado,
      quantidadeEntregue: entregue,
      quantidadeAProduzir: aProduzir,
      saldoPendente: programado - entregue,
    };
  }

  async atrasos(query: ProgramacaoQueryDto) {
    const hoje = new Date();
    hoje.setUTCHours(0, 0, 0, 0);

    const where: Prisma.ProgramacaoEntregaWhereInput = {
      qtdeAProduzir: { gt: 0 },
      dataProgramacao: { lt: hoje },
      ...this.buildWhere(query),
    };

    const rows = await this.prisma.programacaoEntrega.findMany({
      where,
      orderBy: { dataProgramacao: 'asc' },
      take: 200,
      include: {
        produto: { include: { grupo: true, classificacao: true } },
      },
    });

    return {
      total: rows.length,
      itens: rows.map(serializeProgramacao),
    };
  }

  async create(dto: CreateProgramacaoDto) {
    const produto = await this.resolverProduto(dto);
    const dataProgramacao = new Date(dto.dataProgramacao);
    const flag = dto.flag?.trim() || 'P';
    const plano = dto.plano?.trim() || '';
    const desenhoCliente = dto.desenhoCliente?.trim() || produto.desenhoCliente || '';

    const qtdeAProduzir = dto.quantidade;

    try {
      const row = await this.prisma.programacaoEntrega.create({
        data: {
          dataProgramacao,
          produtoId: produto.produtoId,
          grupoCodigo: produto.grupoCodigo,
          classificacaoCodigo: produto.classificacaoCodigo,
          itemCodigo: produto.itemCodigo,
          plano,
          flag,
          quantidade: dto.quantidade,
          pedidoRef: dto.pedidoRef?.trim() || null,
          pedidoRef2: dto.pedidoRef2?.trim() || null,
          desenhoCliente,
          qtdeEntregue: 0,
          qtdeAProduzir,
          devolvido: false,
        },
        include: {
          produto: { include: { grupo: true, classificacao: true } },
        },
      });
      return serializeProgramacao(row);
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        throw new BadRequestException(
          'Já existe programação com esta chave (data/produto/plano/flag)',
        );
      }
      throw e;
    }
  }

  async update(id: number, dto: UpdateProgramacaoDto) {
    const atual = await this.carregar(id);

    if (atual.qtdeEntregue > 0 && dto.quantidade != null) {
      throw new BadRequestException(
        'Não é possível alterar quantidade após entregas registradas',
      );
    }

    const data: Prisma.ProgramacaoEntregaUpdateInput = {};
    if (dto.quantidade != null) {
      data.quantidade = dto.quantidade;
      data.qtdeAProduzir = dto.quantidade - atual.qtdeEntregue;
    }
    if (dto.pedidoRef != null) data.pedidoRef = dto.pedidoRef;
    if (dto.pedidoRef2 != null) data.pedidoRef2 = dto.pedidoRef2;
    if (dto.plano != null) data.plano = dto.plano;

    const row = await this.prisma.programacaoEntrega.update({
      where: { id },
      data,
      include: {
        produto: { include: { grupo: true, classificacao: true } },
      },
    });
    return serializeProgramacao(row);
  }

  /** Registra entrega parcial ou total (PC1066 — baixa de programação). */
  async registrarEntrega(id: number, dto: RegistrarEntregaDto) {
    const atual = await this.carregar(id);
    const pendente = atual.quantidade - atual.qtdeEntregue;

    if (dto.quantidade > pendente) {
      throw new BadRequestException(
        `Quantidade excede saldo pendente (${pendente})`,
      );
    }

    const novaEntregue = atual.qtdeEntregue + dto.quantidade;
    const novaAProduzir = Math.max(atual.qtdeAProduzir - dto.quantidade, 0);

    const row = await this.prisma.programacaoEntrega.update({
      where: { id },
      data: {
        qtdeEntregue: novaEntregue,
        qtdeAProduzir: novaAProduzir,
      },
      include: {
        produto: { include: { grupo: true, classificacao: true } },
      },
    });
    return serializeProgramacao(row);
  }

  async remove(id: number) {
    const atual = await this.carregar(id);
    if (atual.qtdeEntregue > 0) {
      throw new BadRequestException(
        'Não é possível excluir — já houve entrega deste programa',
      );
    }
    await this.prisma.programacaoEntrega.delete({ where: { id } });
    return { ok: true };
  }

  private async carregar(id: number) {
    const row = await this.prisma.programacaoEntrega.findUnique({
      where: { id },
      include: {
        produto: { include: { grupo: true, classificacao: true } },
      },
    });
    if (!row) {
      throw new NotFoundException(`Programação ${id} não encontrada`);
    }
    return row;
  }

  private buildWhere(
    query: ProgramacaoQueryDto,
  ): Prisma.ProgramacaoEntregaWhereInput {
    const and: Prisma.ProgramacaoEntregaWhereInput[] = [];

    if (query.dataInicio) {
      and.push({ dataProgramacao: { gte: new Date(query.dataInicio) } });
    }
    if (query.dataFim) {
      and.push({ dataProgramacao: { lte: new Date(query.dataFim) } });
    }
    if (query.flag?.trim()) {
      and.push({ flag: query.flag.trim() });
    }

    if (query.search?.trim()) {
      const term = query.search.trim();
      const asNumber = parseInt(term, 10);
      const or: Prisma.ProgramacaoEntregaWhereInput[] = [
        { desenhoCliente: { contains: term, mode: 'insensitive' } },
        { pedidoRef: { contains: term, mode: 'insensitive' } },
        { pedidoRef2: { contains: term, mode: 'insensitive' } },
        { plano: { contains: term, mode: 'insensitive' } },
      ];
      if (!Number.isNaN(asNumber)) {
        or.push({ itemCodigo: asNumber });
        or.push({ grupoCodigo: asNumber });
      }
      and.push({ OR: or });
    }

    return and.length ? { AND: and } : {};
  }

  private async resolverProduto(dto: CreateProgramacaoDto) {
    if (dto.produtoId) {
      const p = await this.prisma.produto.findUnique({
        where: { id: dto.produtoId },
      });
      if (!p) throw new BadRequestException('Produto não encontrado');
      return {
        produtoId: p.id,
        grupoCodigo: p.grupoCodigo,
        classificacaoCodigo: p.classificacaoCodigo,
        itemCodigo: p.itemCodigo,
        desenhoCliente: p.desenhoCliente,
      };
    }

    const desenho = dto.desenhoCliente?.trim();
    if (desenho) {
      const p = await this.prisma.produto.findFirst({
        where: { desenhoCliente: desenho },
      });
      if (p) {
        return {
          produtoId: p.id,
          grupoCodigo: p.grupoCodigo,
          classificacaoCodigo: p.classificacaoCodigo,
          itemCodigo: p.itemCodigo,
          desenhoCliente: p.desenhoCliente,
        };
      }
      return {
        produtoId: null,
        grupoCodigo: 0,
        classificacaoCodigo: 0,
        itemCodigo: 0,
        desenhoCliente: desenho,
      };
    }

    if (
      dto.grupoCodigo != null &&
      dto.classificacaoCodigo != null &&
      dto.itemCodigo != null
    ) {
      const p = await this.prisma.produto.findFirst({
        where: {
          grupoCodigo: dto.grupoCodigo,
          classificacaoCodigo: dto.classificacaoCodigo,
          itemCodigo: dto.itemCodigo,
        },
      });
      return {
        produtoId: p?.id ?? null,
        grupoCodigo: dto.grupoCodigo,
        classificacaoCodigo: dto.classificacaoCodigo,
        itemCodigo: dto.itemCodigo,
        desenhoCliente: p?.desenhoCliente ?? null,
      };
    }

    throw new BadRequestException(
      'Informe produtoId, desenhoCliente ou grupo/classificação/item',
    );
  }
}
