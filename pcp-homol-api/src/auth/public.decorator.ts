import { SetMetadata } from '@nestjs/common';

/** Rotas públicas (sem JWT): login e health. */
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
