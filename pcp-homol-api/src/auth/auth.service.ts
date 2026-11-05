import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Usuario } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { UsuariosService } from '../usuarios/usuarios.service';
import { AuthUser } from './auth-user';
import { LoginDto } from './dto/login.dto';

function toAuthUser(u: Usuario): AuthUser {
  return {
    id: u.id,
    username: u.username,
    nome: u.nome,
    isAdmin: u.isAdmin,
    permissoes: u.permissoes,
    trocarSenha: u.trocarSenha,
  };
}

@Injectable()
export class AuthService {
  constructor(
    private readonly config: ConfigService,
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
    private readonly usuarios: UsuariosService,
  ) {}

  /** Autentica um usuário cadastrado na tabela Usuario. */
  async login(dto: LoginDto) {
    const username = dto.username.trim().toLowerCase();
    const usuario = await this.prisma.usuario.findUnique({ where: { username } });

    const passOk = usuario
      ? await bcrypt.compare(dto.password, usuario.senhaHash)
      : false;

    if (!usuario || !passOk || !usuario.ativo) {
      // Mensagem genérica — não revela se o usuário ou a senha erraram
      throw new UnauthorizedException('Usuário ou senha inválidos.');
    }

    await this.prisma.usuario.update({
      where: { id: usuario.id },
      data: { ultimoLogin: new Date() },
    });

    const expiresSeconds = Number(
      this.config.get('JWT_EXPIRES_SECONDS') ?? 8 * 60 * 60,
    );
    const accessToken = await this.jwt.signAsync(
      { sub: usuario.id, username: usuario.username },
      { expiresIn: expiresSeconds },
    );

    return {
      accessToken,
      tokenType: 'Bearer',
      expiresIn: `${expiresSeconds}s`,
      user: toAuthUser(usuario),
    };
  }

  /** Retorna quem está autenticado (usado por GET /auth/me). */
  me(user: AuthUser) {
    return user;
  }

  async trocarSenha(userId: number, senhaAtual: string, novaSenha: string) {
    const usuario = await this.prisma.usuario.findUniqueOrThrow({
      where: { id: userId },
    });
    if (!(await bcrypt.compare(senhaAtual, usuario.senhaHash))) {
      throw new BadRequestException('Senha atual incorreta.');
    }
    if (await bcrypt.compare(novaSenha, usuario.senhaHash)) {
      throw new BadRequestException('A nova senha precisa ser diferente da atual.');
    }
    await this.prisma.usuario.update({
      where: { id: userId },
      data: {
        senhaHash: await this.usuarios.hashSenha(novaSenha),
        trocarSenha: false,
      },
    });
    return { ok: true };
  }
}
