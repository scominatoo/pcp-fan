import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { AuthUser } from '../auth/auth-user';
import { PERMISSAO_GERENCIAR_USUARIOS } from '../auth/permissions';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { paginated, paginateParams } from '../common/pagination';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUsuarioDto, UpdateUsuarioDto } from './dto/usuario.dto';
import { serializeUsuario } from './usuario.serializer';

const BCRYPT_COST = 12;

@Injectable()
export class UsuariosService implements OnModuleInit {
  private readonly logger = new Logger(UsuariosService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  /**
   * Primeiro deploy: se não houver nenhum usuário, cria o admin com as
   * credenciais do .env (ADMIN_USERNAME + ADMIN_PASSWORD_HASH/ADMIN_PASSWORD).
   */
  async onModuleInit() {
    const total = await this.prisma.usuario.count();
    if (total > 0) return;

    const username = (this.config.get<string>('ADMIN_USERNAME') ?? 'admin')
      .trim()
      .toLowerCase();
    const hash = this.config.get<string>('ADMIN_PASSWORD_HASH');
    const plain = this.config.get<string>('ADMIN_PASSWORD');
    if (!hash && !plain) {
      this.logger.warn(
        'Nenhum usuário cadastrado e ADMIN_PASSWORD_HASH/ADMIN_PASSWORD ausentes no .env — ninguém conseguirá logar.',
      );
      return;
    }

    await this.prisma.usuario.create({
      data: {
        username,
        nome: 'Administrador',
        senhaHash: hash || (await bcrypt.hash(plain!, BCRYPT_COST)),
        isAdmin: true,
      },
    });
    this.logger.log(`Usuário administrador "${username}" criado a partir do .env.`);
  }

  hashSenha(senha: string) {
    return bcrypt.hash(senha, BCRYPT_COST);
  }

  async findAll(query: PaginationQueryDto) {
    const { page, limit, skip, take } = paginateParams(query);
    const search = query.search?.trim();
    const where: Prisma.UsuarioWhereInput = search
      ? {
          OR: [
            { username: { contains: search, mode: 'insensitive' } },
            { nome: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {};
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.usuario.findMany({
        where,
        skip,
        take,
        orderBy: [{ ativo: 'desc' }, { username: 'asc' }],
      }),
      this.prisma.usuario.count({ where }),
    ]);
    return paginated(rows.map(serializeUsuario), total, page, limit);
  }

  /** Lista enxuta para o seletor "Copiar permissões de…". */
  async opcoes() {
    const rows = await this.prisma.usuario.findMany({
      orderBy: { username: 'asc' },
      select: { id: true, username: true, nome: true, isAdmin: true, permissoes: true },
    });
    return rows;
  }

  async findOne(id: number) {
    return serializeUsuario(await this.getOrThrow(id));
  }

  async create(dto: CreateUsuarioDto) {
    const username = dto.username.trim().toLowerCase();
    const existe = await this.prisma.usuario.findUnique({ where: { username } });
    if (existe) throw new ConflictException(`Usuário "${username}" já existe.`);

    const criado = await this.prisma.usuario.create({
      data: {
        username,
        nome: dto.nome.trim(),
        senhaHash: await this.hashSenha(dto.senha),
        isAdmin: dto.isAdmin ?? false,
        permissoes: dto.permissoes ?? [],
        trocarSenha: dto.exigirTroca ?? false,
      },
    });
    return serializeUsuario(criado);
  }

  async update(id: number, dto: UpdateUsuarioDto, atual: AuthUser) {
    const usuario = await this.getOrThrow(id);
    this.assertPodeAlterar(usuario.isAdmin, atual);

    const ativo = dto.ativo ?? usuario.ativo;
    const isAdmin = dto.isAdmin ?? usuario.isAdmin;
    const permissoes = dto.permissoes ?? usuario.permissoes;

    if (id === atual.id) {
      if (!ativo) throw new BadRequestException('Você não pode desativar o próprio usuário.');
      if (usuario.isAdmin && !isAdmin) {
        throw new BadRequestException('Você não pode remover o seu próprio acesso de administrador.');
      }
      if (!isAdmin && !permissoes.includes(PERMISSAO_GERENCIAR_USUARIOS)) {
        throw new BadRequestException(
          'Você não pode remover a sua própria permissão de gerenciar usuários.',
        );
      }
    }

    // Sempre deve sobrar pelo menos um administrador ativo.
    if (usuario.isAdmin && usuario.ativo && (!isAdmin || !ativo)) {
      const outrosAdmins = await this.prisma.usuario.count({
        where: { isAdmin: true, ativo: true, id: { not: id } },
      });
      if (outrosAdmins === 0) {
        throw new BadRequestException('É preciso manter pelo menos um administrador ativo.');
      }
    }

    // Só um administrador pode conceder ou retirar acesso de administrador.
    if (isAdmin !== usuario.isAdmin && !atual.isAdmin) {
      throw new BadRequestException('Só um administrador pode alterar o acesso de administrador.');
    }

    const atualizado = await this.prisma.usuario.update({
      where: { id },
      data: {
        nome: dto.nome?.trim(),
        ativo,
        isAdmin,
        permissoes,
      },
    });
    return serializeUsuario(atualizado);
  }

  async redefinirSenha(
    id: number,
    senha: string,
    exigirTroca: boolean,
    atual: AuthUser,
  ) {
    const usuario = await this.getOrThrow(id);
    this.assertPodeAlterar(usuario.isAdmin, atual);
    await this.prisma.usuario.update({
      where: { id },
      data: {
        senhaHash: await this.hashSenha(senha),
        // Desmarcado: a senha que o admin cadastrou passa a ser a definitiva.
        trocarSenha: exigirTroca,
      },
    });
    return { ok: true, trocarSenha: exigirTroca };
  }

  /** Quem não é admin não pode mexer em um admin (evita tomar a conta dele). */
  private assertPodeAlterar(alvoIsAdmin: boolean, atual: AuthUser) {
    if (alvoIsAdmin && !atual.isAdmin) {
      throw new ForbiddenException('Só um administrador pode alterar outro administrador.');
    }
  }

  private async getOrThrow(id: number) {
    const usuario = await this.prisma.usuario.findUnique({ where: { id } });
    if (!usuario) throw new NotFoundException('Usuário não encontrado.');
    return usuario;
  }
}
