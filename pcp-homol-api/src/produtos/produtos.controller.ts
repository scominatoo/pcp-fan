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
import { CreateProdutoDto } from './dto/create-produto.dto';
import { UpdateProdutoDto } from './dto/update-produto.dto';
import { ProdutosService } from './produtos.service';

@Controller('produtos')
export class ProdutosController {
  constructor(private readonly produtosService: ProdutosService) {}

  @RequirePermission('produtos.ver')
  @Get()
  findAll(@Query() query: PaginationQueryDto) {
    return this.produtosService.findAll(query);
  }

  @RequirePermission('produtos.ver', 'produtos.criar', 'produtos.editar')
  @Get('grupos')
  listGrupos() {
    return this.produtosService.listGrupos();
  }

  @RequirePermission('produtos.ver', 'produtos.criar', 'produtos.editar')
  @Get('classificacoes')
  listClassificacoes() {
    return this.produtosService.listClassificacoes();
  }

  @RequirePermission('produtos.ver')
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.produtosService.findOne(id);
  }

  @RequirePermission('produtos.criar')
  @Post()
  create(@Body() dto: CreateProdutoDto) {
    return this.produtosService.create(dto);
  }

  @RequirePermission('produtos.editar')
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProdutoDto,
  ) {
    return this.produtosService.update(id, dto);
  }

  @RequirePermission('produtos.excluir')
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.produtosService.remove(id);
  }
}
