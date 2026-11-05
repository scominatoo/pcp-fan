import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { RequirePermission } from '../auth/require-permission.decorator';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { CreateOrdemProducaoDto } from './dto/create-ordem-producao.dto';
import { UpdateOrdemProducaoDto } from './dto/update-ordem-producao.dto';
import { BaixaOperacaoDto } from './dto/baixa-operacao.dto';
import { EncerrarOpDto } from './dto/encerrar-op.dto';
import { BaixaMateriaPrimaDto } from './dto/baixa-materia-prima.dto';
import { OrdensProducaoService } from './ordens-producao.service';

@Controller('ordens-producao')
export class OrdensProducaoController {
  constructor(private readonly service: OrdensProducaoService) {}

  @RequirePermission('ordens_producao.ver')
  @Get()
  findAll(
    @Query() query: PaginationQueryDto,
    @Query('aberta') aberta?: string,
  ) {
    return this.service.findAll({ ...query, aberta });
  }

  @RequirePermission('ordens_producao.criar')
  @Get('proximo-codigo')
  proximoCodigo() {
    return this.service.proximoCodigo();
  }

  @RequirePermission('ordens_producao.criar')
  @Get('preparar-criacao')
  prepararCriacao(@Query('produtoCodigo') produtoCodigo: string) {
    return this.service.prepararCriacao(produtoCodigo ?? '');
  }

  /**
   * Autocomplete do campo "Desenho do cliente" na inclusão da OP.
   * Fonte: tabela DesenhoCliente (legado PCPA106I).
   */
  @RequirePermission('ordens_producao.criar')
  @Get('buscar-desenhos')
  buscarDesenhos(
    @Query('q') q?: string,
    @Query('limit') limit?: string,
  ) {
    const lim = limit ? Number(limit) : 15;
    return this.service.buscarDesenhos(q ?? '', Number.isFinite(lim) ? lim : 15);
  }

  @RequirePermission('ordens_producao.ver')
  @Get('codigo/:codigo')
  findByCodigo(@Param('codigo', ParseIntPipe) codigo: number) {
    return this.service.findByCodigo(codigo);
  }

  @RequirePermission('ordens_producao.imprimir')
  @Get(':id/emissao')
  emissao(@Param('id', ParseIntPipe) id: number) {
    return this.service.emissao(id);
  }

  @RequirePermission('ordens_producao.ver')
  @Get(':id/baixas-mp')
  obterBaixasMp(@Param('id', ParseIntPipe) id: number) {
    return this.service.obterBaixasMp(id);
  }

  @RequirePermission('ordens_producao.ver')
  @Get(':id/baixas')
  obterBaixas(@Param('id', ParseIntPipe) id: number) {
    return this.service.obterBaixas(id);
  }

  @RequirePermission('ordens_producao.ver')
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @RequirePermission('ordens_producao.criar')
  @Post()
  create(@Body() dto: CreateOrdemProducaoDto) {
    return this.service.create(dto);
  }

  @RequirePermission('ordens_producao.baixar_mp')
  @Post(':id/baixas-mp')
  baixarMateriaPrima(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: BaixaMateriaPrimaDto,
  ) {
    return this.service.baixarMateriaPrima(id, dto);
  }

  @RequirePermission('ordens_producao.baixar_operacao')
  @Post(':id/baixas/operacao')
  baixarOperacao(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: BaixaOperacaoDto,
  ) {
    return this.service.baixarOperacao(id, dto);
  }

  @RequirePermission('ordens_producao.encerrar')
  @Post(':id/encerrar')
  encerrarOp(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: EncerrarOpDto,
  ) {
    return this.service.encerrarOp(id, dto);
  }

  @RequirePermission('ordens_producao.editar')
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateOrdemProducaoDto,
  ) {
    return this.service.update(id, dto);
  }

  @RequirePermission('ordens_producao.excluir')
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
