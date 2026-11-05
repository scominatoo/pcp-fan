import { Controller, Get, Query } from '@nestjs/common';
import { RequirePermission } from '../auth/require-permission.decorator';
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

  @RequirePermission('relatorios.op_abertas')
  @Get('op-abertas')
  opAbertas(@Query() query: RelatorioPeriodoQueryDto) {
    return this.service.opAbertas(query);
  }

  @RequirePermission('relatorios.op_baixadas')
  @Get('op-baixadas')
  opBaixadas(@Query() query: RelatorioPeriodoQueryDto) {
    return this.service.opBaixadas(query);
  }

  @RequirePermission('relatorios.producao_setor')
  @Get('producao-setor')
  producaoSetor(@Query() query: RelatorioSetorQueryDto) {
    return this.service.producaoSetor(query);
  }

  @RequirePermission('relatorios.mp_estoque_critico')
  @Get('mp-estoque-critico')
  mpEstoqueCritico(@Query() query: RelatorioMpEstoqueQueryDto) {
    return this.service.mpEstoqueCritico(query);
  }

  @RequirePermission('relatorios.programacao_sintetico')
  @Get('programacao-sintetico')
  programacaoSintetico(@Query() query: RelatorioProgramacaoQueryDto) {
    return this.service.programacaoSintetico(query);
  }
}
