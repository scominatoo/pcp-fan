export type PaginatedMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type PaginatedResponse<T> = {
  data: T[];
  meta: PaginatedMeta;
};

export type Produto = {
  id: number;
  codigo: string;
  grupoCodigo: number;
  classificacaoCodigo: number;
  itemCodigo: number;
  descricao: string;
  unidade: string | null;
  desenhoSparta: string | null;
  desenhoCliente: string | null;
  planejamento: string | null;
  grupoDescricao: string | null;
  classificacaoDescricao: string | null;
};

export type ProdutoGrupo = {
  id: number;
  codigo: number;
  descricao: string;
};

export type ProdutoClassificacao = {
  id: number;
  codigo: number;
  descricao: string;
};

export type MateriaPrima = {
  id: number;
  codigo: string;
  classeLetra: string;
  classeNumero: number;
  itemCodigo: number;
  descricao: string;
  unidade: string | null;
  qualidade: string | null;
  dureza: string | null;
};
