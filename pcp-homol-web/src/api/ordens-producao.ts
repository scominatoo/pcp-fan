import { apiFetch } from './http';

export type OrdemProducaoOperacao = {
  id: number;
  numeroOperacao: number;
  equipamentoGrupo: number | null;
  equipamentoCodigo: number | null;
  indice: number | null;
  ferramentaFabrica: string | null;
  ferramentaNumero: string | null;
  ferramentaMatricula: number | null;
  dataEncerramento: string | null;
};

export type OrdemProducao = {
  id: number;
  codigo: number;
  produtoCodigo: string;
  produtoId: number | null;
  produtoDescricao: string | null;
  produtoCodigoFormatado: string | null;
  quantidade: number;
  dataAbertura: string | null;
  horaAbertura: string | null;
  baixada: boolean;
  baixadaMp: boolean;
  baixadaProduto: boolean;
  tipoProc: string | null;
  tipo: string | null;
  clienteNome: string | null;
  operacoes?: OrdemProducaoOperacao[];
};

export type PrepararCriacaoOp = {
  produtoCodigo: string;
  produtoDescricao: string;
  produtoCodigoFormatado: string;
  materiasPrimas: unknown;
  operacoes: Array<{
    numeroOperacao: number;
    descricao: string | null;
    secaoCodigo: number | null;
    equipamentoPadraoIndice: number;
    alternativas: Array<{
      indice: number;
      equipamentoGrupo: number;
      equipamentoCodigo: number;
      ferramentaNumero: string | null;
      label: string;
    }>;
  }>;
};

export type EmissaoOp = {
  op: OrdemProducao;
  tipoLabel: string;
  materiasPrimas: unknown;
  operacoes: Array<{
    numeroOperacao: number;
    descricao: string | null;
    observacao1: string | null;
    observacao2: string | null;
    plano: string | null;
    secaoCodigo: number | null;
    secaoDescricao: string | null;
    preparacao: string;
    producao: string;
    equipamento: string;
    ferramenta: string | null;
    dataEncerramento: string | null;
  }>;
  emitidoEm: string;
};

type Paginated<T> = {
  data: T[];
  meta: { page: number; limit: number; total: number; totalPages: number };
};

export function listarOps(params: {
  page?: number;
  limit?: number;
  search?: string;
  aberta?: boolean;
}) {
  const qs = new URLSearchParams();
  if (params.page) qs.set('page', String(params.page));
  if (params.limit) qs.set('limit', String(params.limit));
  if (params.search) qs.set('search', params.search);
  if (params.aberta === true) qs.set('aberta', 'true');
  if (params.aberta === false) qs.set('aberta', 'false');
  return apiFetch<Paginated<OrdemProducao>>(
    `/api/ordens-producao${qs.toString() ? `?${qs}` : ''}`,
  );
}

export function obterOp(id: number) {
  return apiFetch<OrdemProducao>(`/api/ordens-producao/${id}`);
}

export function proximoCodigoOp() {
  return apiFetch<{ codigo: number }>('/api/ordens-producao/proximo-codigo');
}

export function prepararCriacaoOp(produtoCodigo: string) {
  const qs = new URLSearchParams({ produtoCodigo });
  return apiFetch<PrepararCriacaoOp>(
    `/api/ordens-producao/preparar-criacao?${qs}`,
  );
}

export type CriarOpPayload = {
  codigo?: number;
  produtoCodigo: string;
  quantidade: number;
  tipo?: string;
  clienteNome?: string;
  operacoes?: Array<{
    numeroOperacao: number;
    indice?: number;
    equipamentoGrupo?: number;
    equipamentoCodigo?: number;
  }>;
};

export function criarOp(payload: CriarOpPayload) {
  return apiFetch<OrdemProducao>('/api/ordens-producao', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function obterEmissaoOp(id: number) {
  return apiFetch<EmissaoOp>(`/api/ordens-producao/${id}/emissao`);
}

export type BaixaOperacaoResumo = {
  id: number;
  dataLancamento: string | null;
  dataInicio: string | null;
  horaInicio: string | null;
  dataFim: string | null;
  horaFim: string | null;
  qtdeSaida: number;
  pesoSaida: number | null;
  qtdeEntrada: number;
  pesoEntrada: number | null;
  atualizouEstoque: boolean;
};

export type OpBaixas = {
  op: {
    id: number;
    codigo: number;
    baixada: boolean;
    baixadaMp: boolean;
    baixadaProduto: boolean;
    quantidade: number;
  };
  consolidada: {
    dataBaixa: string | null;
    horaBaixa: string | null;
    pecasProduzidas: number;
    mpConsumida: number;
    rolos: number;
    temposOperacoes: unknown;
    turno1: number;
    turno2: number;
  } | null;
  operacoes: Array<{
    numeroOperacao: number;
    equipamentoGrupo: number | null;
    equipamentoCodigo: number | null;
    dataEncerramento: string | null;
    baixa: BaixaOperacaoResumo | null;
  }>;
};

export function obterBaixasOp(id: number) {
  return apiFetch<OpBaixas>(`/api/ordens-producao/${id}/baixas`);
}

export type BaixaOperacaoPayload = {
  numeroOperacao: number;
  qtdeSaida: number;
  qtdeEntrada?: number;
  pesoSaida?: number;
  pesoEntrada?: number;
  dataInicio?: string;
  horaInicio?: string;
  dataFim?: string;
  horaFim?: string;
  equipamentoGrupo?: number;
  equipamentoCodigo?: number;
  atualizouEstoque?: boolean;
};

export function baixarOperacaoOp(id: number, payload: BaixaOperacaoPayload) {
  return apiFetch<OpBaixas>(`/api/ordens-producao/${id}/baixas/operacao`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export type EncerrarOpPayload = {
  pecasProduzidas: number;
  mpConsumida?: number;
  rolos?: number;
  turno1?: number;
  turno2?: number;
  baixadaMp?: boolean;
  baixadaProduto?: boolean;
  dataBaixa?: string;
  horaBaixa?: string;
};

export function encerrarOp(id: number, payload: EncerrarOpPayload) {
  return apiFetch<OpBaixas>(`/api/ordens-producao/${id}/encerrar`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export type OpBaixasMp = {
  op: {
    id: number;
    codigo: number;
    baixadaMp: boolean;
    produtoCodigo: string;
  };
  materiasPrimasSugeridas: Array<{
    materiaPrimaId: number | null;
    codigo: string;
    descricao: string | null;
    peso: number | null;
  }>;
  baixas: Array<{
    id: number;
    materiaPrimaId: number;
    materiaPrimaCodigo: string;
    materiaPrimaDescricao: string;
    quantidade: number;
    qtdeRolos: number;
    dataBaixa: string | null;
  }>;
  movimentos: Array<{
    id: number;
    tipo: string;
    origem: string;
    materiaPrimaCodigo: string;
    quantidade: number;
    qtdeRolos: number;
    dataMovimento: string | null;
    lote: string | null;
  }>;
};

export function obterBaixasMpOp(id: number) {
  return apiFetch<OpBaixasMp>(`/api/ordens-producao/${id}/baixas-mp`);
}

export type BaixaMateriaPrimaPayload = {
  materiaPrimaId: number;
  quantidade: number;
  qtdeRolos?: number;
  dataBaixa?: string;
};

export function baixarMateriaPrimaOp(
  id: number,
  payload: BaixaMateriaPrimaPayload,
) {
  return apiFetch<OpBaixasMp>(`/api/ordens-producao/${id}/baixas-mp`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
