import { useQuery } from '@tanstack/react-query';
import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { listarProcessos } from '../../api/processos';
import { PageHeader } from '../../components/PageHeader';
import { Pagination } from '../../components/Pagination';

/**
 * Listagem do cadastro de processo produtivo (legado PC1070).
 * Só consulta — a edição ainda não faz parte do escopo de homologação.
 */
export function ProcessosPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [busca, setBusca] = useState('');

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['processos', page, busca],
    queryFn: () =>
      listarProcessos({ page, limit: 20, search: busca || undefined }),
  });

  function aplicarBusca(e: FormEvent) {
    e.preventDefault();
    setPage(1);
    setBusca(search);
  }

  return (
    <>
      <PageHeader
        eyebrow="Cadastros"
        title="Processos produtivos"
        subtitle="Roteiros migrados do PC1070 (PCPA70I / PCPA70XI). Use o código do desenho ao criar uma OP."
      />

      <section className="card">
        <div className="toolbar">
          <h2>Listagem</h2>
        </div>

        <form className="search-form" onSubmit={aplicarBusca}>
          <input
            type="search"
            placeholder="Buscar por desenho ou descrição do produto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button type="submit" className="btn">
            Buscar
          </button>
        </form>

        {isLoading && <p>Carregando...</p>}
        {isError && (
          <p className="erro">
            {(error as Error).message ?? 'Erro ao carregar'}
          </p>
        )}

        {data && (
          <>
            <p className="meta">
              {data.meta.total.toLocaleString('pt-BR')} processos cadastrados
            </p>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Desenho / chave</th>
                    <th>Produto</th>
                    <th>Operações</th>
                    <th>Peso líq.</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {data.data.map((p) => (
                    <tr key={p.id}>
                      <td className="mono">{p.produtoCodigo}</td>
                      <td>{p.produtoDescricao ?? '—'}</td>
                      <td>{p.qtdeOperacoes}</td>
                      <td>{p.pesoLiquido ?? '—'}</td>
                      <td>
                        <Link to={`/processos/${p.id}`} className="link">
                          Ver roteiro
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
