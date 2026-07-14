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
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { CreateMateriaPrimaDto } from './dto/create-materia-prima.dto';
import { UpdateMateriaPrimaDto } from './dto/update-materia-prima.dto';
import { MateriaPrimaService } from './materia-prima.service';

@Controller('materia-prima')
export class MateriaPrimaController {
  constructor(private readonly materiaPrimaService: MateriaPrimaService) {}

  @Get()
  findAll(@Query() query: PaginationQueryDto) {
    return this.materiaPrimaService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.materiaPrimaService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateMateriaPrimaDto) {
    return this.materiaPrimaService.create(dto);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateMateriaPrimaDto,
  ) {
    return this.materiaPrimaService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.materiaPrimaService.remove(id);
  }
}
