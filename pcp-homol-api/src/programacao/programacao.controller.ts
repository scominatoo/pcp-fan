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

  @Get()
  findAll(@Query() query: ProgramacaoQueryDto) {
    return this.service.findAll(query);
  }

  @Get('resumo')
  resumo(@Query() query: ProgramacaoQueryDto) {
    return this.service.resumo(query);
  }

  @Get('atrasos')
  atrasos(@Query() query: ProgramacaoQueryDto) {
    return this.service.atrasos(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateProgramacaoDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProgramacaoDto,
  ) {
    return this.service.update(id, dto);
  }

  @Post(':id/entrega')
  registrarEntrega(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RegistrarEntregaDto,
  ) {
    return this.service.registrarEntrega(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
