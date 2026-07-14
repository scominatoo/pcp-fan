import { apiFetch } from './http';

type Paginated<T> = {
  data: T[];
  meta: { page: number; limit: number; total: number; totalPages: number };
};

export type RelatorioOpItem = {
  codigo: number;
  produtoCodigo: string;
  produtoDescricao: string | null;
  produtoCodigoFormatado: string | null;
  quantidade: number;
  dataAbertura: string;
  horaAbertura?: string | null;
  tipo: string | null;
  clienteNome: string | null;
  baixadaMp: boolean;
  baixadaProduto: boolean;
  baixa?: {
    dataBaixa: string;
    horaBaixa: string | null;
    pecasProduzidas: number;
    mpConsumida: number | null;
    rolos: number | null;
  } | null;
};

export type RelatorioOpResponse = {
  titulo: string;
  referencia: string;
  data: RelatorioOpItem[];
  meta: Paginated<RelatorioOpItem>['meta'];
  totais: {
    quantidadeOps: number;
    pecasProgramadas?: number;
    pecasProduzidas?: number;
  };
};

export type RelatorioSetorItem = {
  secaoCodigo: number;
  secaoDescricao: string | null;
  qtdeProduzida: number;
  operacoesBaixadas: number;
};

export type RelatorioSetorResponse = {
  titulo: string;
  referencia: string;
  itens: RelatorioSetorItem[];
  totais: {
    setores: number;
    qtdeProduzida: number;
    operacoesBaixadas: number;
  };
};

export type RelatorioMpItem = {
  id: number;
  codigo: string;
  descricao: string | null;
  unidade: string | null;
  quantidade: number;
  estoqueMin: number | null;
  estoqueMax: number | null;
  diferenca: number;
  situacao: 'abaixo_minimo' | 'acima_maximo';
};

export type RelatorioMpResponse = {
  titulo: string;
  referencia: string;
  tipo: string;
  data: RelatorioMpItem[];
  meta: Paginated<RelatorioMpItem>['meta'];
  totais: { abaixoMinimo: number; acimaMaximo: number };
};

export type RelatorioProgramacaoItem = {
  mes: string;
  registros: number;
  programado: number;
  entregue: number;
  aProduzir: number;
};

export type RelatorioProgramacaoResponse = {
  titulo: string;
  referencia: string;
  itens: RelatorioProgramacaoItem[];
  totais: {
    meses: number;
    programado: number;
    entregue: number;
    aProduzir: number;
  };
};

function qs(params: Record<string, string | number | undefined>) {
  const search = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== '') search.set(k, String(v));
  }
  const s = search.toString();
  return s ? `?${s}` : '';
}

export function relatorioOpAbertas(params: {
  page?: number;
  limit?: number;
  dataInicio?: string;
  dataFim?: string;
  codigoOpInicio?: number;
  codigoOpFim?: number;
}) {
  return apiFetch<RelatorioOpResponse>(`/api/relatorios/op-abertas${qs(params)}`);
}

export function relatorioOpBaixadas(params: {
  page?: number;
  limit?: number;
  dataInicio?: string;
  dataFim?: string;
  codigoOpInicio?: number;
  codigoOpFim?: number;
}) {
  return apiFetch<RelatorioOpResponse>(`/api/relatorios/op-baixadas${qs(params)}`);
}

export function relatorioProducaoSetor(params: {
  dataInicio?: string;
  dataFim?: string;
  secaoCodigo?: number;
}) {
  return apiFetch<RelatorioSetorResponse>(
    `/api/relatorios/producao-setor${qs(params)}`,
  );
}

export function relatorioMpEstoqueCritico(params: {
  page?: number;
  limit?: number;
  tipo?: 'minimo' | 'maximo' | 'ambos';
}) {
  return apiFetch<RelatorioMpResponse>(
    `/api/relatorios/mp-estoque-critico${qs(params)}`,
  );
}

export function relatorioProgramacaoSintetico(params: {
  dataInicio?: string;
  dataFim?: string;
}) {
  return apiFetch<RelatorioProgramacaoResponse>(
    `/api/relatorios/programacao-sintetico${qs(params)}`,
  );
}
