import { Produto, ProgramacaoEntrega } from '@prisma/client';
import { formatarCodigoProduto } from '../produtos/produtos.serializer';

type ProgramacaoComProduto = ProgramacaoEntrega & {
  produto?:
    | (Produto & {
        grupo: { descricao: string } | null;
        classificacao: { descricao: string } | null;
      })
    | null;
};

export function serializeProgramacao(row: ProgramacaoComProduto) {
  const saldo =
    row.quantidade - row.qtdeEntregue > 0
      ? row.quantidade - row.qtdeEntregue
      : 0;

  return {
    id: row.id,
    dataProgramacao: row.dataProgramacao,
    grupoCodigo: row.grupoCodigo,
    classificacaoCodigo: row.classificacaoCodigo,
    itemCodigo: row.itemCodigo,
    produtoId: row.produtoId,
    produtoDescricao: row.produto?.descricao ?? null,
    produtoCodigoFormatado: row.produto
      ? formatarCodigoProduto(row.produto)
      : row.grupoCodigo > 0
        ? `${String(row.grupoCodigo).padStart(3, '0')}-${String(row.classificacaoCodigo).padStart(2, '0')}-${String(row.itemCodigo).padStart(5, '0')}`
        : null,
    desenhoCliente: row.desenhoCliente || null,
    plano: row.plano || null,
    flag: row.flag,
    quantidade: row.quantidade,
    pedidoRef: row.pedidoRef,
    pedidoRef2: row.pedidoRef2,
    qtdeEntregue: row.qtdeEntregue,
    qtdeAProduzir: row.qtdeAProduzir,
    saldoPendente: saldo,
    devolvido: row.devolvido,
    atrasado:
      row.qtdeAProduzir > 0 &&
      row.dataProgramacao < new Date(new Date().toISOString().slice(0, 10)),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
