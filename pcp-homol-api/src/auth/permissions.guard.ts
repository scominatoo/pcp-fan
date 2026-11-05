import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthRequest } from './auth-user';
import { IS_PUBLIC_KEY } from './public.decorator';
import { PERMISSIONS_KEY } from './require-permission.decorator';

/** Roda depois do JwtAuthGuard e confere as permissões exigidas pela rota. */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const targets = [context.getHandler(), context.getClass()];
    if (this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, targets)) {
      return true;
    }

    const exigidas = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      targets,
    );
    if (!exigidas || exigidas.length === 0) return true;

    const user = context.switchToHttp().getRequest<AuthRequest>().user;
    if (user?.isAdmin) return true;
    if (user && exigidas.some((p) => user.permissoes.includes(p))) return true;

    throw new ForbiddenException('Você não tem permissão para esta ação.');
  }
}
