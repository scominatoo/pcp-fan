import { OrdemProducao, OrdemProducaoOperacao, Produto } from '@prisma/client';
import { formatarCodigoProduto } from '../produtos/produtos.serializer';

type OpComRelacoes = OrdemProducao & {
  produto?:
    | (Produto & {
        grupo: { descricao: string } | null;
        classificacao: { descricao: string } | null;
      })
    | null;
  operacoes?: OrdemProducaoOperacao[];
};

export function serializeOrdemProducao(op: OpComRelacoes, comOperacoes = false) {
  return {
    id: op.id,
    codigo: op.codigo,
    produtoCodigo: op.produtoCodigo,
    produtoId: op.produtoId,
    produtoDescricao: op.produto?.descricao ?? null,
    produtoCodigoFormatado: op.produto
      ? formatarCodigoProduto(op.produto)
      : null,
    quantidade: op.quantidade,
    dataAbertura: op.dataAbertura,
    horaAbertura: op.horaAbertura,
    baixada: op.baixada,
    baixadaMp: op.baixadaMp,
    baixadaProduto: op.baixadaProduto,
    tipoProc: op.tipoProc,
    tipo: op.tipo,
    clienteNome: op.clienteNome,
    operacoes: comOperacoes
      ? (op.operacoes ?? []).map((o) => ({
          id: o.id,
          numeroOperacao: o.numeroOperacao,
          equipamentoGrupo: o.equipamentoGrupo,
          equipamentoCodigo: o.equipamentoCodigo,
          indice: o.indice,
          ferramentaFabrica: o.ferramentaFabrica,
          ferramentaNumero: o.ferramentaNumero,
          ferramentaMatricula: o.ferramentaMatricula,
          dataEncerramento: o.dataEncerramento,
        }))
      : undefined,
    createdAt: op.createdAt,
    updatedAt: op.updatedAt,
  };
}
