import { Produto, ProdutoClassificacao, ProdutoGrupo } from '@prisma/client';
import { decimalToString } from '../common/serialize-decimal';

export type ProdutoComRelacoes = Produto & {
  grupo: ProdutoGrupo | null;
  classificacao: ProdutoClassificacao | null;
};

/** Código legado: 001-01-00001 */
export function formatarCodigoProduto(p: Produto): string {
  return [
    String(p.grupoCodigo).padStart(3, '0'),
    String(p.classificacaoCodigo).padStart(2, '0'),
    String(p.itemCodigo).padStart(5, '0'),
  ].join('-');
}

export function serializeProduto(produto: ProdutoComRelacoes) {
  return {
    id: produto.id,
    codigo: formatarCodigoProduto(produto),
    grupoCodigo: produto.grupoCodigo,
    classificacaoCodigo: produto.classificacaoCodigo,
    itemCodigo: produto.itemCodigo,
    descricao: produto.descricao,
    unidade: produto.unidade,
    precoCusto: decimalToString(produto.precoCusto),
    precoVenda: decimalToString(produto.precoVenda),
    quantidadeEstoque: decimalToString(produto.quantidadeEstoque),
    estoqueMin: decimalToString(produto.estoqueMin),
    estoqueMax: decimalToString(produto.estoqueMax),
    desenhoSparta: produto.desenhoSparta,
    desenhoCliente: produto.desenhoCliente,
    planejamento: produto.planejamento,
    peso: decimalToString(produto.peso),
    pesoBruto: decimalToString(produto.pesoBruto),
    grupoDescricao: produto.grupo?.descricao ?? null,
    classificacaoDescricao: produto.classificacao?.descricao ?? null,
    createdAt: produto.createdAt,
    updatedAt: produto.updatedAt,
  };
}
