import { apiFetch } from './http';
import type {
  PaginatedResponse,
  Produto,
  ProdutoClassificacao,
  ProdutoGrupo,
} from './types';

export type ProdutoInput = {
  grupoCodigo: number;
  classificacaoCodigo: number;
  itemCodigo: number;
  descricao: string;
  unidade?: string;
  desenhoSparta?: string;
  desenhoCliente?: string;
  planejamento?: string;
};

export function listarProdutos(params: {
  page?: number;
  limit?: number;
  search?: string;
}) {
  const q = new URLSearchParams();
  if (params.page) q.set('page', String(params.page));
  if (params.limit) q.set('limit', String(params.limit));
  if (params.search) q.set('search', params.search);
  const qs = q.toString();
  return apiFetch<PaginatedResponse<Produto>>(
    `/api/produtos${qs ? `?${qs}` : ''}`,
  );
}

export function obterProduto(id: number) {
  return apiFetch<Produto>(`/api/produtos/${id}`);
}

export function criarProduto(data: ProdutoInput) {
  return apiFetch<Produto>('/api/produtos', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function atualizarProduto(id: number, data: Partial<ProdutoInput>) {
  return apiFetch<Produto>(`/api/produtos/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export function excluirProduto(id: number) {
  return apiFetch<{ ok: boolean }>(`/api/produtos/${id}`, {
    method: 'DELETE',
  });
}

export function listarGrupos() {
  return apiFetch<ProdutoGrupo[]>('/api/produtos/grupos');
}

export function listarClassificacoes() {
  return apiFetch<ProdutoClassificacao[]>('/api/produtos/classificacoes');
}
