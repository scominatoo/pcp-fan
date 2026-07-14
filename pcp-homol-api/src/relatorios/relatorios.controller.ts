import { Controller, Get, Query } from '@nestjs/common';
import {
  RelatorioMpEstoqueQueryDto,
  RelatorioPeriodoQueryDto,
  RelatorioProgramacaoQueryDto,
  RelatorioSetorQueryDto,
} from './dto/relatorio-query.dto';
import { RelatoriosService } from './relatorios.service';

@Controller('relatorios')
export class RelatoriosController {
  constructor(private readonly service: RelatoriosService) {}

  @Get('op-abertas')
  opAbertas(@Query() query: RelatorioPeriodoQueryDto) {
    return this.service.opAbertas(query);
  }

  @Get('op-baixadas')
  opBaixadas(@Query() query: RelatorioPeriodoQueryDto) {
    return this.service.opBaixadas(query);
  }

  @Get('producao-setor')
  producaoSetor(@Query() query: RelatorioSetorQueryDto) {
    return this.service.producaoSetor(query);
  }

  @Get('mp-estoque-critico')
  mpEstoqueCritico(@Query() query: RelatorioMpEstoqueQueryDto) {
    return this.service.mpEstoqueCritico(query);
  }

  @Get('programacao-sintetico')
  programacaoSintetico(@Query() query: RelatorioProgramacaoQueryDto) {
    return this.service.programacaoSintetico(query);
  }
}
