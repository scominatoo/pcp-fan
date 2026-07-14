import { apiFetch } from './http';
import type { MateriaPrima, PaginatedResponse } from './types';

export type MateriaPrimaInput = {
  classeLetra: string;
  classeNumero: number;
  itemCodigo: number;
  descricao: string;
  unidade?: string;
  qualidade?: string;
  dureza?: string;
};

export function listarMateriaPrima(params: {
  page?: number;
  limit?: number;
  search?: string;
}) {
  const q = new URLSearchParams();
  if (params.page) q.set('page', String(params.page));
  if (params.limit) q.set('limit', String(params.limit));
  if (params.search) q.set('search', params.search);
  const qs = q.toString();
  return apiFetch<PaginatedResponse<MateriaPrima>>(
    `/api/materia-prima${qs ? `?${qs}` : ''}`,
  );
}

export function obterMateriaPrima(id: number) {
  return apiFetch<MateriaPrima>(`/api/materia-prima/${id}`);
}

export function criarMateriaPrima(data: MateriaPrimaInput) {
  return apiFetch<MateriaPrima>('/api/materia-prima', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function atualizarMateriaPrima(
  id: number,
  data: Partial<MateriaPrimaInput>,
) {
  return apiFetch<MateriaPrima>(`/api/materia-prima/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export function excluirMateriaPrima(id: number) {
  return apiFetch<{ ok: boolean }>(`/api/materia-prima/${id}`, {
    method: 'DELETE',
  });
}
