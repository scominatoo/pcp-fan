import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { paginateParams, paginated } from '../common/pagination';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEquipamentoDto } from './dto/create-equipamento.dto';
import { UpdateEquipamentoDto } from './dto/update-equipamento.dto';

@Injectable()
export class EquipamentosService {
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
              modelo: {
                contains: query.search.trim(),
                mode: 'insensitive' as const,
              },
            },
          ],
        }
      : {};

    const [rows, total] = await Promise.all([
      this.prisma.equipamento.findMany({
        where,
        skip,
        take,
        orderBy: [{ grupoCodigo: 'asc' }, { codigo: 'asc' }],
      }),
      this.prisma.equipamento.count({ where }),
    ]);

    return paginated(rows, total, page, limit);
  }

  async findOne(id: number) {
    const item = await this.prisma.equipamento.findUnique({ where: { id } });
    if (!item) {
      throw new NotFoundException(`Equipamento ${id} não encontrado`);
    }
    return item;
  }

  async create(dto: CreateEquipamentoDto) {
    try {
      return await this.prisma.equipamento.create({ data: dto });
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        throw new BadRequestException('Equipamento já cadastrado');
      }
      throw e;
    }
  }

  async update(id: number, dto: UpdateEquipamentoDto) {
    await this.findOne(id);
    return this.prisma.equipamento.update({ where: { id }, data: dto });
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.equipamento.delete({ where: { id } });
    return { ok: true };
  }
}
