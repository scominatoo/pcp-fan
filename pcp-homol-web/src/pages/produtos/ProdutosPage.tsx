import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { listarProdutos } from '../../api/produtos';
import { PageHeader } from '../../components/PageHeader';
import { Pagination } from '../../components/Pagination';

export function ProdutosPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [busca, setBusca] = useState('');

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['produtos', page, busca],
    queryFn: () => listarProdutos({ page, limit: 20, search: busca || undefined }),
  });

  function aplicarBusca(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    setBusca(search);
  }

  return (
    <>
      <PageHeader eyebrow="Cadastros" title="Produtos" />

      <section className="card">
      <div className="toolbar">
        <h2>Listagem</h2>
        <Link to="/produtos/novo" className="btn btn-primary">
          Novo produto
        </Link>
      </div>

      <form className="search-form" onSubmit={aplicarBusca}>
        <input
          type="search"
          placeholder="Buscar por descrição, desenho ou código..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button type="submit" className="btn">
          Buscar
        </button>
      </form>

      {isLoading && <p>Carregando...</p>}
      {isError && (
        <p className="erro">{(error as Error).message ?? 'Erro ao carregar'}</p>
      )}

      {data && (
        <>
          <p className="meta">
            {data.meta.total.toLocaleString('pt-BR')} produtos cadastrados
          </p>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Descrição</th>
                  <th>Un.</th>
                  <th>Grupo</th>
                  <th>Classif.</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {data.data.map((p) => (
                  <tr key={p.id}>
                    <td className="mono">{p.codigo}</td>
                    <td>{p.descricao}</td>
                    <td>{p.unidade ?? '—'}</td>
                    <td title={p.grupoDescricao ?? ''}>{p.grupoCodigo}</td>
                    <td title={p.classificacaoDescricao ?? ''}>
                      {p.classificacaoCodigo}
                    </td>
                    <td>
                      <Link to={`/produtos/${p.id}`} className="link">
                        Editar
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            page={data.meta.page}
            totalPages={data.meta.totalPages}
            onPageChange={setPage}
          />
        </>
      )}
    </section>
    </>
  );
}
