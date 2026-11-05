import { Request } from 'express';

/** Usuário autenticado anexado à requisição pelo JwtAuthGuard. */
export type AuthUser = {
  id: number;
  username: string;
  nome: string;
  isAdmin: boolean;
  permissoes: string[];
  /** true = só pode usar o sistema depois de trocar a senha. */
  trocarSenha: boolean;
};

export type AuthRequest = Request & { user?: AuthUser };
