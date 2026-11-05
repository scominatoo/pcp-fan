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
import { CreateMateriaPrimaDto } from './dto/create-materia-prima.dto';
import { UpdateMateriaPrimaDto } from './dto/update-materia-prima.dto';
import { MateriaPrimaService } from './materia-prima.service';

@Controller('materia-prima')
export class MateriaPrimaController {
  constructor(private readonly materiaPrimaService: MateriaPrimaService) {}

  @RequirePermission('materia_prima.ver')
  @Get()
  findAll(@Query() query: PaginationQueryDto) {
    return this.materiaPrimaService.findAll(query);
  }

  @RequirePermission('materia_prima.ver')
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.materiaPrimaService.findOne(id);
  }

  @RequirePermission('materia_prima.criar')
  @Post()
  create(@Body() dto: CreateMateriaPrimaDto) {
    return this.materiaPrimaService.create(dto);
  }

  @RequirePermission('materia_prima.editar')
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateMateriaPrimaDto,
  ) {
    return this.materiaPrimaService.update(id, dto);
  }

  @RequirePermission('materia_prima.excluir')
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.materiaPrimaService.remove(id);
  }
}
