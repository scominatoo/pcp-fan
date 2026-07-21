import { apiFetch } from './http';

/** Cliente migrado de PCPA04I (PC1004). */
export type Cliente = {
  id: number;
  codigo: number;
  empresa: string;
  sufixo: string | null;
  endereco: string | null;
  enderecoCobranca: string | null;
  cidade: string | null;
  estado: string | null;
  cep: string | null;
  bairro: string | null;
  telefone1: string | null;
  telefone2: string | null;
  ddd: number | null;
  cgc: string | null;
  inscricaoEstadual: string | null;
  ccm: string | null;
  contato1: string | null;
  contato2: string | null;
  fax: string | null;
  tipo: string | null;
  vendedorCodigo: number | null;
  enderecoEntrega: string | null;
  createdAt: string;
  updatedAt: string;
};

/** Sugestão enxuta para autocomplete. */
export type ClienteSugestao = {
  id: number;
  codigo: number;
  empresa: string;
  sufixo: string | null;
  cidade: string | null;
  estado: string | null;
  cgc: string | null;
  /** Nome pronto para gravar na OP (empresa — sufixo) */
  label: string;
};

type Paginated<T> = {
  data: T[];
  meta: { page: number; limit: number; total: number; totalPages: number };
};

export function listarClientes(params: {
  page?: number;
  limit?: number;
  search?: string;
}) {
  const qs = new URLSearchParams();
  if (params.page) qs.set('page', String(params.page));
  if (params.limit) qs.set('limit', String(params.limit));
  if (params.search) qs.set('search', params.search);
  return apiFetch<Paginated<Cliente>>(
    `/api/clientes${qs.toString() ? `?${qs}` : ''}`,
  );
}

export function buscarClientes(q: string, limit = 15) {
  const qs = new URLSearchParams({ q, limit: String(limit) });
  return apiFetch<ClienteSugestao[]>(`/api/clientes/buscar?${qs}`);
}

export function obterCliente(id: number) {
  return apiFetch<Cliente>(`/api/clientes/${id}`);
}

export function obterClientePorCodigo(codigo: number) {
  return apiFetch<Cliente>(`/api/clientes/codigo/${codigo}`);
}
