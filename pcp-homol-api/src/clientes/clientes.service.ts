import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { paginateParams, paginated } from '../common/pagination';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Cadastro de clientes migrados do COBOL PC1004 (PCPA04I.DAT).
 * Por enquanto só leitura — criação/edição ficam para depois do aceite FANANDRI.
 */
@Injectable()
export class ClientesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: PaginationQueryDto) {
    const { page, limit, skip, take } = paginateParams(query);
    const where = this.buildSearchWhere(query.search);

    const [rows, total] = await Promise.all([
      this.prisma.cliente.findMany({
        where,
        skip,
        take,
        orderBy: { codigo: 'asc' },
      }),
      this.prisma.cliente.count({ where }),
    ]);

    return paginated(rows, total, page, limit);
  }

  /**
   * Autocomplete — retorna poucas sugestões rápidas (código, empresa, CNPJ).
   * Usado na página de Clientes e no campo Cliente da OP.
   */
  async buscar(q: string, limit = 15) {
    const term = q.trim();
    if (term.length < 1) {
      return [];
    }

    const take = Math.min(Math.max(limit, 1), 30);
    const asNumber = parseInt(term, 10);
    const or: Prisma.ClienteWhereInput[] = [
      { empresa: { contains: term, mode: 'insensitive' } },
      { sufixo: { contains: term, mode: 'insensitive' } },
      { cgc: { contains: term, mode: 'insensitive' } },
      { cidade: { contains: term, mode: 'insensitive' } },
      { contato1: { contains: term, mode: 'insensitive' } },
    ];
    if (!Number.isNaN(asNumber)) {
      or.unshift({ codigo: asNumber });
    }

    const rows = await this.prisma.cliente.findMany({
      where: { OR: or },
      take,
      orderBy: { empresa: 'asc' },
      select: {
        id: true,
        codigo: true,
        empresa: true,
        sufixo: true,
        cidade: true,
        estado: true,
        cgc: true,
      },
    });

    // Nome de exibição = empresa + sufixo (como no legado comercial)
    return rows.map((c) => ({
      id: c.id,
      codigo: c.codigo,
      empresa: c.empresa,
      sufixo: c.sufixo,
      cidade: c.cidade,
      estado: c.estado,
      cgc: c.cgc,
      label: [c.empresa.trim(), c.sufixo?.trim()].filter(Boolean).join(' — '),
    }));
  }

  async findOne(id: number) {
    const item = await this.prisma.cliente.findUnique({ where: { id } });
    if (!item) {
      throw new NotFoundException(`Cliente ${id} não encontrado`);
    }
    return item;
  }

  async findByCodigo(codigo: number) {
    const item = await this.prisma.cliente.findUnique({ where: { codigo } });
    if (!item) {
      throw new NotFoundException(`Cliente código ${codigo} não encontrado`);
    }
    return item;
  }

  private buildSearchWhere(search?: string): Prisma.ClienteWhereInput {
    if (!search?.trim()) return {};
    const term = search.trim();
    const asNumber = parseInt(term, 10);
    const or: Prisma.ClienteWhereInput[] = [
      { empresa: { contains: term, mode: 'insensitive' } },
      { sufixo: { contains: term, mode: 'insensitive' } },
      { cgc: { contains: term, mode: 'insensitive' } },
      { cidade: { contains: term, mode: 'insensitive' } },
      { bairro: { contains: term, mode: 'insensitive' } },
      { contato1: { contains: term, mode: 'insensitive' } },
    ];
    if (!Number.isNaN(asNumber)) {
      or.unshift({ codigo: asNumber });
    }
    return { OR: or };
  }
}
