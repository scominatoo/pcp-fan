import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { paginateParams, paginated } from '../common/pagination';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSecaoDto } from './dto/create-secao.dto';
import { UpdateSecaoDto } from './dto/update-secao.dto';

@Injectable()
export class SecoesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: PaginationQueryDto) {
    const { page, limit, skip, take } = paginateParams(query);
    const where = query.search?.trim()
      ? {
          OR: [
            {
              descricao: {
                contains: query.search.trim(),
                mode: 'insensitive' as const,
              },
            },
            {
              responsavel1: {
                contains: query.search.trim(),
                mode: 'insensitive' as const,
              },
            },
          ],
        }
      : {};

    const [rows, total] = await Promise.all([
      this.prisma.secao.findMany({
        where,
        skip,
        take,
        orderBy: { codigo: 'asc' },
      }),
      this.prisma.secao.count({ where }),
    ]);

    return paginated(rows, total, page, limit);
  }

  async findOne(id: number) {
    const item = await this.prisma.secao.findUnique({ where: { id } });
    if (!item) {
      throw new NotFoundException(`Seção ${id} não encontrada`);
    }
    return item;
  }

  async create(dto: CreateSecaoDto) {
    try {
      return await this.prisma.secao.create({ data: dto });
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        throw new BadRequestException('Seção com este código já existe');
      }
      throw e;
    }
  }

  async update(id: number, dto: UpdateSecaoDto) {
    await this.findOne(id);
    try {
      return await this.prisma.secao.update({ where: { id }, data: dto });
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        throw new BadRequestException('Seção com este código já existe');
      }
      throw e;
    }
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.secao.delete({ where: { id } });
    return { ok: true };
  }
}
