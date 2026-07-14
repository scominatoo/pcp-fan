import { apiFetch } from './http';
import type { PaginatedResponse } from './types';

/** Resumo na listagem de processos (PC1070). */
export type ProcessoResumo = {
  id: number;
  produtoCodigo: string;
  pesoBruto: string | null;
  pesoLiquido: string | null;
  qtdeOp: number | null;
  producaoHr: number | null;
  produtoId: number | null;
  produtoDescricao: string | null;
  desenhoCliente: string | null;
  desenhoSparta: string | null;
  qtdeOperacoes: number;
};

/** Detalhe com operações do roteiro. */
export type ProcessoDetalhe = {
  id: number;
  produtoCodigo: string;
  pesoBruto: string | null;
  pesoLiquido: string | null;
  qtdeOp: number | null;
  producaoHr: number | null;
  materiasPrimas: unknown;
  materiasPrimasComplemento: unknown;
  produto: {
    id: number;
    descricao: string;
    desenhoCliente: string | null;
    desenhoSparta: string | null;
    grupoCodigo: number;
    classificacaoCodigo: number;
    itemCodigo: number;
  } | null;
  operacoes: Array<{
    id: number;
    numeroOperacao: number;
    descricao: string | null;
    observacao1: string | null;
    observacao2: string | null;
    plano: string | null;
    secaoCodigo: number | null;
    preparacaoSegundos: number | null;
    producaoSegundos: number | null;
    cacamba: string | null;
    pecas: number | null;
    equipamentoEscolhido: number | null;
    equipamentosTab: unknown;
  }>;
};

export function listarProcessos(params: {
  page?: number;
  limit?: number;
  search?: string;
}) {
  const q = new URLSearchParams();
  if (params.page) q.set('page', String(params.page));
  if (params.limit) q.set('limit', String(params.limit));
  if (params.search) q.set('search', params.search);
  const qs = q.toString();
  return apiFetch<PaginatedResponse<ProcessoResumo>>(
    `/api/processos${qs ? `?${qs}` : ''}`,
  );
}

export function obterProcesso(id: number) {
  return apiFetch<ProcessoDetalhe>(`/api/processos/${id}`);
}
