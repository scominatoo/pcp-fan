import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { ClientesService } from './clientes.service';

@Controller('clientes')
export class ClientesController {
  constructor(private readonly clientesService: ClientesService) {}

  @Get()
  findAll(@Query() query: PaginationQueryDto) {
    return this.clientesService.findAll(query);
  }

  /**
   * Autocomplete — deve ficar ANTES de :id para não ser engolido pela rota.
   * Ex.: GET /api/clientes/buscar?q=metal&limit=10
   */
  @Get('buscar')
  buscar(@Query('q') q?: string, @Query('limit') limit?: string) {
    const lim = limit ? Number(limit) : 15;
    return this.clientesService.buscar(q ?? '', Number.isFinite(lim) ? lim : 15);
  }

  @Get('codigo/:codigo')
  findByCodigo(@Param('codigo', ParseIntPipe) codigo: number) {
    return this.clientesService.findByCodigo(codigo);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.clientesService.findOne(id);
  }
}
