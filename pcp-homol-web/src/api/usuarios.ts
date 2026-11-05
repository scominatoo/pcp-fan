import { apiFetch } from './http';
import type { PaginatedResponse } from './types';

export type Usuario = {
  id: number;
  username: string;
  nome: string;
  ativo: boolean;
  isAdmin: boolean;
  permissoes: string[];
  trocarSenha: boolean;
  ultimoLogin: string | null;
  createdAt: string;
  updatedAt: string;
};

export type UsuarioOpcao = Pick<
  Usuario,
  'id' | 'username' | 'nome' | 'isAdmin' | 'permissoes'
>;

export type AcaoPermissao = {
  chave: string;
  rotulo: string;
  tipo: 'crud' | 'especial';
};

export type ModuloPermissao = {
  modulo: string;
  rotulo: string;
  grupo: string;
  acoes: AcaoPermissao[];
};

export type UsuarioInput = {
  username: string;
  nome: string;
  senha: string;
  /** Obriga trocar a senha no primeiro login. */
  exigirTroca: boolean;
  isAdmin: boolean;
  permissoes: string[];
};

export type UsuarioUpdate = Partial<
  Pick<Usuario, 'nome' | 'ativo' | 'isAdmin' | 'permissoes'>
>;

export function listarUsuarios(params: {
  page?: number;
  limit?: number;
  search?: string;
}) {
  const q = new URLSearchParams();
  if (params.page) q.set('page', String(params.page));
  if (params.limit) q.set('limit', String(params.limit));
  if (params.search) q.set('search', params.search);
  return apiFetch<PaginatedResponse<Usuario>>(`/api/usuarios?${q}`);
}

export function obterUsuario(id: number) {
  return apiFetch<Usuario>(`/api/usuarios/${id}`);
}

export function listarOpcoesUsuarios() {
  return apiFetch<UsuarioOpcao[]>('/api/usuarios/opcoes');
}

export function obterCatalogoPermissoes() {
  return apiFetch<ModuloPermissao[]>('/api/usuarios/permissoes-catalogo');
}

export function criarUsuario(data: UsuarioInput) {
  return apiFetch<Usuario>('/api/usuarios', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function atualizarUsuario(id: number, data: UsuarioUpdate) {
  return apiFetch<Usuario>(`/api/usuarios/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export function redefinirSenhaUsuario(
  id: number,
  senha: string,
  exigirTroca: boolean,
) {
  return apiFetch<{ ok: boolean; trocarSenha: boolean }>(
    `/api/usuarios/${id}/senha`,
    {
      method: 'PATCH',
      body: JSON.stringify({ senha, exigirTroca }),
    },
  );
}
