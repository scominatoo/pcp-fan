import { SetMetadata } from '@nestjs/common';

/** Rotas que funcionam mesmo com troca de senha pendente (ex.: /auth/me). */
export const ALLOW_PENDING_PASSWORD_KEY = 'allowPendingPassword';
export const AllowPendingPassword = () =>
  SetMetadata(ALLOW_PENDING_PASSWORD_KEY, true);
