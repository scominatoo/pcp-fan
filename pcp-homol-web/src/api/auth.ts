import { apiFetch } from './http';

export type AuthUser = {
  id: number;
  username: string;
  nome: string;
  isAdmin: boolean;
  permissoes: string[];
  /** Senha redefinida pelo admin: precisa trocar antes de usar o sistema. */
  trocarSenha: boolean;
};

export type LoginResponse = {
  accessToken: string;
  tokenType: string;
  expiresIn: string;
  user: AuthUser;
};

export function login(username: string, password: string) {
  return apiFetch<LoginResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
}

export function fetchMe() {
  return apiFetch<AuthUser>('/api/auth/me');
}

export function trocarSenha(senhaAtual: string, novaSenha: string) {
  return apiFetch<{ ok: boolean }>('/api/auth/trocar-senha', {
    method: 'POST',
    body: JSON.stringify({ senhaAtual, novaSenha }),
  });
}
