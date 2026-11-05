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
import {
  CreateProgramacaoDto,
  ProgramacaoQueryDto,
  RegistrarEntregaDto,
  UpdateProgramacaoDto,
} from './dto/programacao.dto';
import { ProgramacaoService } from './programacao.service';

@Controller('programacao')
export class ProgramacaoController {
  constructor(private readonly service: ProgramacaoService) {}

  @RequirePermission('programacao.ver')
  @Get()
  findAll(@Query() query: ProgramacaoQueryDto) {
    return this.service.findAll(query);
  }

  @RequirePermission('programacao.ver')
  @Get('resumo')
  resumo(@Query() query: ProgramacaoQueryDto) {
    return this.service.resumo(query);
  }

  @RequirePermission('programacao.ver')
  @Get('atrasos')
  atrasos(@Query() query: ProgramacaoQueryDto) {
    return this.service.atrasos(query);
  }

  @RequirePermission('programacao.ver')
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @RequirePermission('programacao.criar')
  @Post()
  create(@Body() dto: CreateProgramacaoDto) {
    return this.service.create(dto);
  }

  @RequirePermission('programacao.editar')
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProgramacaoDto,
  ) {
    return this.service.update(id, dto);
  }

  @RequirePermission('programacao.registrar_entrega')
  @Post(':id/entrega')
  registrarEntrega(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RegistrarEntregaDto,
  ) {
    return this.service.registrarEntrega(id, dto);
  }

  @RequirePermission('programacao.excluir')
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
