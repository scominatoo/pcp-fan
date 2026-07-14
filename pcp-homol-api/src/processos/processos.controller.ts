import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { ProcessosService } from './processos.service';

/** Rotas de consulta do cadastro de processo produtivo (PC1070). */
@Controller('processos')
export class ProcessosController {
  constructor(private readonly processosService: ProcessosService) {}

  @Get()
  findAll(@Query() query: PaginationQueryDto) {
    return this.processosService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.processosService.findOne(id);
  }
}
