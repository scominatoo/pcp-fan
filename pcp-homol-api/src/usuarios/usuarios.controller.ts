import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { AuthRequest } from '../auth/auth-user';
import {
  CATALOGO_PERMISSOES,
  PERMISSAO_GERENCIAR_USUARIOS,
} from '../auth/permissions';
import { RequirePermission } from '../auth/require-permission.decorator';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import {
  CreateUsuarioDto,
  RedefinirSenhaDto,
  UpdateUsuarioDto,
} from './dto/usuario.dto';
import { UsuariosService } from './usuarios.service';

@Controller('usuarios')
@RequirePermission(PERMISSAO_GERENCIAR_USUARIOS)
export class UsuariosController {
  constructor(private readonly service: UsuariosService) {}

  @Get('permissoes-catalogo')
  catalogo() {
    return CATALOGO_PERMISSOES;
  }

  @Get('opcoes')
  opcoes() {
    return this.service.opcoes();
  }

  @Get()
  findAll(@Query() query: PaginationQueryDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateUsuarioDto, @Req() req: AuthRequest) {
    if (dto.isAdmin && !req.user!.isAdmin) {
      throw new BadRequestException('Só um administrador pode criar outro administrador.');
    }
    return this.service.create(dto);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUsuarioDto,
    @Req() req: AuthRequest,
  ) {
    return this.service.update(id, dto, req.user!);
  }

  @Patch(':id/senha')
  redefinirSenha(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RedefinirSenhaDto,
    @Req() req: AuthRequest,
  ) {
    return this.service.redefinirSenha(
      id,
      dto.senha,
      dto.exigirTroca ?? false,
      req.user!,
    );
  }
}
