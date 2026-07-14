import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { listarMateriaPrima } from '../../api/materia-prima';
import { PageHeader } from '../../components/PageHeader';
import { Pagination } from '../../components/Pagination';

export function MateriaPrimaPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [busca, setBusca] = useState('');

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['materia-prima', page, busca],
    queryFn: () =>
      listarMateriaPrima({ page, limit: 20, search: busca || undefined }),
  });

  function aplicarBusca(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    setBusca(search);
  }

  return (
    <>
      <PageHeader eyebrow="Cadastros" title="Matéria-prima" />

      <section className="card">
      <div className="toolbar">
        <h2>Listagem</h2>
        <Link to="/materia-prima/novo" className="btn btn-primary">
          Novo item
        </Link>
      </div>

      <form className="search-form" onSubmit={aplicarBusca}>
        <input
          type="search"
          placeholder="Buscar por descrição, qualidade ou classe..."
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
            {data.meta.total.toLocaleString('pt-BR')} itens cadastrados
          </p>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Descrição</th>
                  <th>Un.</th>
                  <th>Qualidade</th>
                  <th>Dureza</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {data.data.map((mp) => (
                  <tr key={mp.id}>
                    <td className="mono">{mp.codigo}</td>
                    <td>{mp.descricao}</td>
                    <td>{mp.unidade ?? '—'}</td>
                    <td>{mp.qualidade ?? '—'}</td>
                    <td>{mp.dureza ?? '—'}</td>
                    <td>
                      <Link to={`/materia-prima/${mp.id}`} className="link">
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
