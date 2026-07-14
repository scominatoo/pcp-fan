import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { paginateParams, paginated } from '../common/pagination';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMateriaPrimaDto } from './dto/create-materia-prima.dto';
import { UpdateMateriaPrimaDto } from './dto/update-materia-prima.dto';
import { serializeMateriaPrima } from './materia-prima.serializer';

@Injectable()
export class MateriaPrimaService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: PaginationQueryDto) {
    const { page, limit, skip, take } = paginateParams(query);
    const where = this.buildSearchWhere(query.search);

    const [rows, total] = await Promise.all([
      this.prisma.materiaPrima.findMany({
        where,
        skip,
        take,
        orderBy: [
          { classeLetra: 'asc' },
          { classeNumero: 'asc' },
          { itemCodigo: 'asc' },
        ],
      }),
      this.prisma.materiaPrima.count({ where }),
    ]);

    return paginated(
      rows.map(serializeMateriaPrima),
      total,
      page,
      limit,
    );
  }

  async findOne(id: number) {
    const mp = await this.prisma.materiaPrima.findUnique({ where: { id } });
    if (!mp) {
      throw new NotFoundException(`Matéria-prima ${id} não encontrada`);
    }
    return serializeMateriaPrima(mp);
  }

  async create(dto: CreateMateriaPrimaDto) {
    try {
      const mp = await this.prisma.materiaPrima.create({
        data: {
          ...dto,
          classeLetra: dto.classeLetra.toUpperCase(),
        },
      });
      return serializeMateriaPrima(mp);
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        throw new BadRequestException(
          'Já existe matéria-prima com este código',
        );
      }
      throw e;
    }
  }

  async update(id: number, dto: UpdateMateriaPrimaDto) {
    await this.findOne(id);

    try {
      const mp = await this.prisma.materiaPrima.update({
        where: { id },
        data: {
          ...dto,
          classeLetra: dto.classeLetra?.toUpperCase(),
        },
      });
      return serializeMateriaPrima(mp);
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        throw new BadRequestException(
          'Já existe matéria-prima com este código',
        );
      }
      throw e;
    }
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.materiaPrima.delete({ where: { id } });
    return { ok: true };
  }

  private buildSearchWhere(search?: string): Prisma.MateriaPrimaWhereInput {
    if (!search?.trim()) return {};

    const term = search.trim().toUpperCase();
    return {
      OR: [
        { descricao: { contains: search.trim(), mode: 'insensitive' } },
        { qualidade: { contains: search.trim(), mode: 'insensitive' } },
        { classeLetra: { startsWith: term.charAt(0) } },
      ],
    };
  }
}
