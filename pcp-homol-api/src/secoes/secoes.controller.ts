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
import { CreateSecaoDto } from './dto/create-secao.dto';
import { UpdateSecaoDto } from './dto/update-secao.dto';
import { SecoesService } from './secoes.service';

@Controller('secoes')
export class SecoesController {
  constructor(private readonly secoesService: SecoesService) {}

  @Get()
  findAll(@Query() query: PaginationQueryDto) {
    return this.secoesService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.secoesService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateSecaoDto) {
    return this.secoesService.create(dto);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSecaoDto,
  ) {
    return this.secoesService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.secoesService.remove(id);
  }
}
