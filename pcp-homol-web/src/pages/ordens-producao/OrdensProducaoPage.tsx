import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { listarOps } from '../../api/ordens-producao';
import { PageHeader } from '../../components/PageHeader';
import { Pagination } from '../../components/Pagination';

function formatarData(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('pt-BR');
}

export function OrdensProducaoPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [busca, setBusca] = useState('');
  const [somenteAbertas, setSomenteAbertas] = useState(false);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['ops', page, busca, somenteAbertas],
    queryFn: () =>
      listarOps({
        page,
        limit: 20,
        search: busca || undefined,
        aberta: somenteAbertas ? true : undefined,
      }),
  });

  function aplicarBusca(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    setBusca(search);
  }

  return (
    <>
      <PageHeader
        eyebrow="Produção"
        title="Ordens de produção"
        actions={
          <Link to="/ordens-producao/novo" className="btn btn-primary">
            Nova OP
          </Link>
        }
      />

      <section className="card">
      <form className="search-form" onSubmit={aplicarBusca}>
        <input
          type="search"
          placeholder="Buscar por código OP, produto ou cliente..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <label className="checkbox-inline">
          <input
            type="checkbox"
            checked={somenteAbertas}
            onChange={(e) => {
              setSomenteAbertas(e.target.checked);
              setPage(1);
            }}
          />
          Somente abertas
        </label>
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
            {data.meta.total.toLocaleString('pt-BR')} ordens de produção
          </p>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>OP</th>
                  <th>Produto</th>
                  <th>Descrição</th>
                  <th>Qtd</th>
                  <th>Abertura</th>
                  <th>Tipo</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {data.data.map((op) => (
                  <tr key={op.id}>
                    <td className="mono">{op.codigo}</td>
                    <td className="mono">{op.produtoCodigo}</td>
                    <td>{op.produtoDescricao ?? '—'}</td>
                    <td>{op.quantidade.toLocaleString('pt-BR')}</td>
                    <td>
                      {formatarData(op.dataAbertura)}
                      {op.horaAbertura ? ` ${op.horaAbertura}` : ''}
                    </td>
                    <td>{op.tipo ?? '—'}</td>
                    <td>{op.baixada ? 'Baixada' : 'Aberta'}</td>
                    <td>
                      <Link to={`/ordens-producao/${op.id}`} className="link">
                        Detalhes
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
