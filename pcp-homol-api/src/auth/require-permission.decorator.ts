import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'permissions';

/**
 * Exige que o usuário tenha pelo menos UMA das permissões informadas.
 * Administradores passam sempre. Rotas sem este decorator exigem só login.
 */
export const RequirePermission = (...permissoes: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissoes);
