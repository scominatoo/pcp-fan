import { apiFetch } from './http';

export type ProgramacaoEntrega = {
  id: number;
  dataProgramacao: string;
  grupoCodigo: number;
  classificacaoCodigo: number;
  itemCodigo: number;
  produtoId: number | null;
  produtoDescricao: string | null;
  produtoCodigoFormatado: string | null;
  desenhoCliente: string | null;
  plano: string | null;
  flag: string | null;
  quantidade: number;
  pedidoRef: string | null;
  pedidoRef2: string | null;
  qtdeEntregue: number;
  qtdeAProduzir: number;
  saldoPendente: number;
  devolvido: boolean;
  atrasado: boolean;
};

type Paginated<T> = {
  data: T[];
  meta: { page: number; limit: number; total: number; totalPages: number };
};

export function listarProgramacao(params: {
  page?: number;
  limit?: number;
  search?: string;
  dataInicio?: string;
  dataFim?: string;
  flag?: string;
}) {
  const qs = new URLSearchParams();
  if (params.page) qs.set('page', String(params.page));
  if (params.limit) qs.set('limit', String(params.limit));
  if (params.search) qs.set('search', params.search);
  if (params.dataInicio) qs.set('dataInicio', params.dataInicio);
  if (params.dataFim) qs.set('dataFim', params.dataFim);
  if (params.flag) qs.set('flag', params.flag);
  return apiFetch<Paginated<ProgramacaoEntrega>>(
    `/api/programacao${qs.toString() ? `?${qs}` : ''}`,
  );
}

export function obterProgramacao(id: number) {
  return apiFetch<ProgramacaoEntrega>(`/api/programacao/${id}`);
}

export function resumoProgramacao(params: {
  dataInicio?: string;
  dataFim?: string;
}) {
  const qs = new URLSearchParams();
  if (params.dataInicio) qs.set('dataInicio', params.dataInicio);
  if (params.dataFim) qs.set('dataFim', params.dataFim);
  return apiFetch<{
    totalRegistros: number;
    quantidadeProgramada: number;
    quantidadeEntregue: number;
    quantidadeAProduzir: number;
    saldoPendente: number;
  }>(`/api/programacao/resumo${qs.toString() ? `?${qs}` : ''}`);
}

export function atrasosProgramacao(params: {
  dataInicio?: string;
  dataFim?: string;
}) {
  const qs = new URLSearchParams();
  if (params.dataInicio) qs.set('dataInicio', params.dataInicio);
  if (params.dataFim) qs.set('dataFim', params.dataFim);
  return apiFetch<{ total: number; itens: ProgramacaoEntrega[] }>(
    `/api/programacao/atrasos${qs.toString() ? `?${qs}` : ''}`,
  );
}

export type CriarProgramacaoPayload = {
  dataProgramacao: string;
  quantidade: number;
  produtoId?: number;
  desenhoCliente?: string;
  grupoCodigo?: number;
  classificacaoCodigo?: number;
  itemCodigo?: number;
  plano?: string;
  flag?: string;
  pedidoRef?: string;
  pedidoRef2?: string;
};

export function criarProgramacao(payload: CriarProgramacaoPayload) {
  return apiFetch<ProgramacaoEntrega>('/api/programacao', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function registrarEntregaProgramacao(
  id: number,
  quantidade: number,
) {
  return apiFetch<ProgramacaoEntrega>(`/api/programacao/${id}/entrega`, {
    method: 'POST',
    body: JSON.stringify({ quantidade }),
  });
}
