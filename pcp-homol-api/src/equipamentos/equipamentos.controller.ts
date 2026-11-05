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
import { CreateEquipamentoDto } from './dto/create-equipamento.dto';
import { UpdateEquipamentoDto } from './dto/update-equipamento.dto';
import { EquipamentosService } from './equipamentos.service';

@Controller('equipamentos')
export class EquipamentosController {
  constructor(private readonly equipamentosService: EquipamentosService) {}

  @RequirePermission('equipamentos.ver')
  @Get()
  findAll(@Query() query: PaginationQueryDto) {
    return this.equipamentosService.findAll(query);
  }

  @RequirePermission('equipamentos.ver')
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.equipamentosService.findOne(id);
  }

  @RequirePermission('equipamentos.criar')
  @Post()
  create(@Body() dto: CreateEquipamentoDto) {
    return this.equipamentosService.create(dto);
  }

  @RequirePermission('equipamentos.editar')
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateEquipamentoDto,
  ) {
    return this.equipamentosService.update(id, dto);
  }

  @RequirePermission('equipamentos.excluir')
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.equipamentosService.remove(id);
  }
}
