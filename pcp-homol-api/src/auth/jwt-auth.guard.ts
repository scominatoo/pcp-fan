import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { ALLOW_PENDING_PASSWORD_KEY } from './allow-pending-password.decorator';
import { AuthRequest } from './auth-user';
import { IS_PUBLIC_KEY } from './public.decorator';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<AuthRequest>();
    const token = this.extractBearer(request);
    if (!token) {
      throw new UnauthorizedException('Faça login para continuar.');
    }

    let userId: number;
    try {
      const payload = await this.jwt.verifyAsync<{ sub: number | string }>(
        token,
        { secret: this.config.getOrThrow<string>('JWT_SECRET') },
      );
      userId = Number(payload.sub);
    } catch {
      throw new UnauthorizedException(
        'Sessão expirada ou inválida. Faça login novamente.',
      );
    }

    // Busca o usuário a cada requisição: desativação e mudança de
    // permissões valem imediatamente, sem esperar o token expirar.
    const usuario = Number.isInteger(userId)
      ? await this.prisma.usuario.findUnique({ where: { id: userId } })
      : null;
    if (!usuario || !usuario.ativo) {
      throw new UnauthorizedException(
        'Sessão expirada ou inválida. Faça login novamente.',
      );
    }

    request.user = {
      id: usuario.id,
      username: usuario.username,
      nome: usuario.nome,
      isAdmin: usuario.isAdmin,
      permissoes: usuario.permissoes,
      trocarSenha: usuario.trocarSenha,
    };

    // Senha redefinida pelo admin com troca obrigatória: só libera as rotas
    // necessárias para trocar a senha.
    if (usuario.trocarSenha) {
      const liberada = this.reflector.getAllAndOverride<boolean>(
        ALLOW_PENDING_PASSWORD_KEY,
        [context.getHandler(), context.getClass()],
      );
      if (!liberada) {
        throw new ForbiddenException(
          'Troque a sua senha antes de continuar.',
        );
      }
    }
    return true;
  }

  private extractBearer(request: AuthRequest): string | undefined {
    const header = request.headers.authorization;
    if (!header) return undefined;
    const [type, token] = header.split(' ');
    return type === 'Bearer' ? token : undefined;
  }
}
