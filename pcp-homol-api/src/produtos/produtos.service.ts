import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { paginateParams, paginated } from '../common/pagination';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProdutoDto } from './dto/create-produto.dto';
import { UpdateProdutoDto } from './dto/update-produto.dto';
import { serializeProduto } from './produtos.serializer';

@Injectable()
export class ProdutosService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: PaginationQueryDto) {
    const { page, limit, skip, take } = paginateParams(query);
    const where = this.buildSearchWhere(query.search);

    const [rows, total] = await Promise.all([
      this.prisma.produto.findMany({
        where,
        skip,
        take,
        orderBy: [
          { grupoCodigo: 'asc' },
          { classificacaoCodigo: 'asc' },
          { itemCodigo: 'asc' },
        ],
        include: { grupo: true, classificacao: true },
      }),
      this.prisma.produto.count({ where }),
    ]);

    return paginated(
      rows.map(serializeProduto),
      total,
      page,
      limit,
    );
  }

  async findOne(id: number) {
    const produto = await this.prisma.produto.findUnique({
      where: { id },
      include: { grupo: true, classificacao: true },
    });
    if (!produto) {
      throw new NotFoundException(`Produto ${id} não encontrado`);
    }
    return serializeProduto(produto);
  }

  async create(dto: CreateProdutoDto) {
    await this.validarChavesEstrangeiras(dto.grupoCodigo, dto.classificacaoCodigo);

    try {
      const produto = await this.prisma.produto.create({
        data: dto,
        include: { grupo: true, classificacao: true },
      });
      return serializeProduto(produto);
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        throw new BadRequestException('Já existe produto com este código');
      }
      throw e;
    }
  }

  async update(id: number, dto: UpdateProdutoDto) {
    await this.findOne(id);

    if (dto.grupoCodigo != null || dto.classificacaoCodigo != null) {
      const atual = await this.prisma.produto.findUniqueOrThrow({
        where: { id },
      });
      await this.validarChavesEstrangeiras(
        dto.grupoCodigo ?? atual.grupoCodigo,
        dto.classificacaoCodigo ?? atual.classificacaoCodigo,
      );
    }

    try {
      const produto = await this.prisma.produto.update({
        where: { id },
        data: dto,
        include: { grupo: true, classificacao: true },
      });
      return serializeProduto(produto);
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        throw new BadRequestException('Já existe produto com este código');
      }
      throw e;
    }
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.produto.delete({ where: { id } });
    return { ok: true };
  }

  listGrupos() {
    return this.prisma.produtoGrupo.findMany({
      orderBy: { codigo: 'asc' },
    });
  }

  listClassificacoes() {
    return this.prisma.produtoClassificacao.findMany({
      orderBy: { codigo: 'asc' },
    });
  }

  private buildSearchWhere(search?: string): Prisma.ProdutoWhereInput {
    if (!search?.trim()) return {};

    const term = search.trim();
    const asNumber = parseInt(term.replace(/\D/g, ''), 10);

    const or: Prisma.ProdutoWhereInput[] = [
      { descricao: { contains: term, mode: 'insensitive' } },
      { desenhoCliente: { contains: term, mode: 'insensitive' } },
      { desenhoSparta: { contains: term, mode: 'insensitive' } },
    ];

    if (!Number.isNaN(asNumber) && term.replace(/\D/g, '').length > 0) {
      or.push({ grupoCodigo: asNumber });
      or.push({ itemCodigo: asNumber });
    }

    return { OR: or };
  }

  private async validarChavesEstrangeiras(
    grupoCodigo: number,
    classificacaoCodigo: number,
  ) {
    const [grupo, classificacao] = await Promise.all([
      this.prisma.produtoGrupo.findUnique({ where: { codigo: grupoCodigo } }),
      this.prisma.produtoClassificacao.findUnique({
        where: { codigo: classificacaoCodigo },
      }),
    ]);

    if (!grupo) {
      throw new BadRequestException(`Grupo ${grupoCodigo} não cadastrado`);
    }
    if (!classificacao) {
      throw new BadRequestException(
        `Classificação ${classificacaoCodigo} não cadastrada`,
      );
    }
  }
}
