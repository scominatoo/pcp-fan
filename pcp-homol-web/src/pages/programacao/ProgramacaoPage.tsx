import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  atrasosProgramacao,
  listarProgramacao,
  resumoProgramacao,
} from '../../api/programacao';
import { PageHeader } from '../../components/PageHeader';
import { Pagination } from '../../components/Pagination';

function formatarData(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('pt-BR');
}

export function ProgramacaoPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [busca, setBusca] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [filtros, setFiltros] = useState({ dataInicio: '', dataFim: '' });
  const [aba, setAba] = useState<'lista' | 'atrasos'>('lista');

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['programacao', page, busca, filtros],
    queryFn: () =>
      listarProgramacao({
        page,
        limit: 20,
        search: busca || undefined,
        dataInicio: filtros.dataInicio || undefined,
        dataFim: filtros.dataFim || undefined,
      }),
    enabled: aba === 'lista',
  });

  const { data: resumo } = useQuery({
    queryKey: ['programacao-resumo', filtros],
    queryFn: () =>
      resumoProgramacao({
        dataInicio: filtros.dataInicio || undefined,
        dataFim: filtros.dataFim || undefined,
      }),
  });

  const { data: atrasos, isLoading: carregandoAtrasos } = useQuery({
    queryKey: ['programacao-atrasos', filtros],
    queryFn: () =>
      atrasosProgramacao({
        dataInicio: filtros.dataInicio || undefined,
        dataFim: filtros.dataFim || undefined,
      }),
    enabled: aba === 'atrasos',
  });

  function aplicarFiltros(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    setBusca(search);
    setFiltros({ dataInicio, dataFim });
  }

  return (
    <>
      <PageHeader
        eyebrow="Planejamento"
        title="Programação de entregas"
        actions={
          <Link to="/programacao/novo" className="btn btn-primary">
            Nova programação
          </Link>
        }
      />

      <section className="card">
      {resumo && (
        <dl className="detail-grid compact">
          <dt>Registros</dt>
          <dd>{resumo.totalRegistros.toLocaleString('pt-BR')}</dd>
          <dt>Programado</dt>
          <dd>{resumo.quantidadeProgramada.toLocaleString('pt-BR')}</dd>
          <dt>Entregue</dt>
          <dd>{resumo.quantidadeEntregue.toLocaleString('pt-BR')}</dd>
          <dt>A produzir</dt>
          <dd>{resumo.quantidadeAProduzir.toLocaleString('pt-BR')}</dd>
          <dt>Saldo pendente</dt>
          <dd>{resumo.saldoPendente.toLocaleString('pt-BR')}</dd>
        </dl>
      )}

      <form className="search-form" onSubmit={aplicarFiltros}>
        <input
          type="search"
          placeholder="Buscar desenho, pedido, plano..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <input
          type="date"
          value={dataInicio}
          onChange={(e) => setDataInicio(e.target.value)}
          title="Data início"
        />
        <input
          type="date"
          value={dataFim}
          onChange={(e) => setDataFim(e.target.value)}
          title="Data fim"
        />
        <button type="submit" className="btn">
          Filtrar
        </button>
      </form>

      <div className="tabs">
        <button
          type="button"
          className={aba === 'lista' ? 'tab tab--active' : 'tab'}
          onClick={() => setAba('lista')}
        >
          Lista
        </button>
        <button
          type="button"
          className={aba === 'atrasos' ? 'tab tab--active' : 'tab'}
          onClick={() => setAba('atrasos')}
        >
          Atrasos
        </button>
      </div>

      {aba === 'lista' && (
        <>
          {isLoading && <p>Carregando...</p>}
          {isError && <p className="erro">{(error as Error).message}</p>}
          {data && (
            <>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Data</th>
                      <th>Produto</th>
                      <th>Desenho</th>
                      <th>Plano</th>
                      <th>Flag</th>
                      <th>Qtde</th>
                      <th>Entregue</th>
                      <th>A produzir</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.data.map((p) => (
                      <tr key={p.id} className={p.atrasado ? 'row-atraso' : ''}>
                        <td>{formatarData(p.dataProgramacao)}</td>
                        <td className="mono">
                          {p.produtoCodigoFormatado ?? '—'}
                        </td>
                        <td className="mono">{p.desenhoCliente ?? '—'}</td>
                        <td>{p.plano ?? '—'}</td>
                        <td>{p.flag ?? '—'}</td>
                        <td>{p.quantidade.toLocaleString('pt-BR')}</td>
                        <td>{p.qtdeEntregue.toLocaleString('pt-BR')}</td>
                        <td>{p.qtdeAProduzir.toLocaleString('pt-BR')}</td>
                        <td>
                          <Link to={`/programacao/${p.id}`}>Detalhe</Link>
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
        </>
      )}

      {aba === 'atrasos' && (
        <>
          {carregandoAtrasos && <p>Carregando atrasos...</p>}
          {atrasos && (
            <>
              <p>
                <strong>{atrasos.total}</strong> item(ns) com produção pendente
                e data vencida
              </p>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Data</th>
                      <th>Produto / Desenho</th>
                      <th>A produzir</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {atrasos.itens.map((p) => (
                      <tr key={p.id}>
                        <td>{formatarData(p.dataProgramacao)}</td>
                        <td>
                          {p.produtoCodigoFormatado ?? p.desenhoCliente ?? '—'}
                        </td>
                        <td>{p.qtdeAProduzir.toLocaleString('pt-BR')}</td>
                        <td>
                          <Link to={`/programacao/${p.id}`}>Detalhe</Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}
    </section>
    </>
  );
}
