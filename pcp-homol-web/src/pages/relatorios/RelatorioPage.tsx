import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  relatorioMpEstoqueCritico,
  relatorioOpAbertas,
  relatorioOpBaixadas,
  relatorioProducaoSetor,
  relatorioProgramacaoSintetico,
  type RelatorioMpResponse,
  type RelatorioOpResponse,
  type RelatorioProgramacaoResponse,
  type RelatorioSetorResponse,
} from '../../api/relatorios';
import { Pagination } from '../../components/Pagination';
import { PageHeader } from '../../components/PageHeader';

type TipoRelatorio =
  | 'op-abertas'
  | 'op-baixadas'
  | 'producao-setor'
  | 'mp-estoque-critico'
  | 'programacao-sintetico';

const REFERENCIAS: Record<TipoRelatorio, string> = {
  'op-abertas': 'PC1078',
  'op-baixadas': 'PC1071',
  'producao-setor': 'PC1135',
  'mp-estoque-critico': 'PC1059',
  'programacao-sintetico': 'PC1067',
};

const TITULOS: Record<TipoRelatorio, string> = {
  'op-abertas': 'OP em aberto',
  'op-baixadas': 'OP baixadas',
  'producao-setor': 'Produção por setor',
  'mp-estoque-critico': 'Estoque MP crítico',
  'programacao-sintetico': 'Programação sintética',
};

function formatarData(iso: string | null | undefined) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('pt-BR');
}

export function RelatorioPage() {
  const { tipo } = useParams<{ tipo: string }>();
  const relatorio = (tipo ?? '') as TipoRelatorio;
  const titulo = TITULOS[relatorio] ?? 'Relatório';
  const referencia = REFERENCIAS[relatorio] ?? '';

  const [page, setPage] = useState(1);
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [codigoOpInicio, setCodigoOpInicio] = useState('');
  const [codigoOpFim, setCodigoOpFim] = useState('');
  const [secaoCodigo, setSecaoCodigo] = useState('');
  const [tipoMp, setTipoMp] = useState<'minimo' | 'maximo' | 'ambos'>('ambos');
  const [filtros, setFiltros] = useState({
    dataInicio: '',
    dataFim: '',
    codigoOpInicio: '',
    codigoOpFim: '',
    secaoCodigo: '',
    tipoMp: 'ambos' as 'minimo' | 'maximo' | 'ambos',
  });

  const invalido = !TITULOS[relatorio];

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['relatorio', relatorio, page, filtros],
    queryFn: async () => {
      const base = {
        dataInicio: filtros.dataInicio || undefined,
        dataFim: filtros.dataFim || undefined,
      };
      switch (relatorio) {
        case 'op-abertas':
          return relatorioOpAbertas({
            page,
            limit: 50,
            ...base,
            codigoOpInicio: filtros.codigoOpInicio
              ? Number(filtros.codigoOpInicio)
              : undefined,
            codigoOpFim: filtros.codigoOpFim
              ? Number(filtros.codigoOpFim)
              : undefined,
          });
        case 'op-baixadas':
          return relatorioOpBaixadas({
            page,
            limit: 50,
            ...base,
            codigoOpInicio: filtros.codigoOpInicio
              ? Number(filtros.codigoOpInicio)
              : undefined,
            codigoOpFim: filtros.codigoOpFim
              ? Number(filtros.codigoOpFim)
              : undefined,
          });
        case 'producao-setor':
          return relatorioProducaoSetor({
            ...base,
            secaoCodigo: filtros.secaoCodigo
              ? Number(filtros.secaoCodigo)
              : undefined,
          });
        case 'mp-estoque-critico':
          return relatorioMpEstoqueCritico({
            page,
            limit: 50,
            tipo: filtros.tipoMp,
          });
        case 'programacao-sintetico':
          return relatorioProgramacaoSintetico(base);
        default:
          throw new Error('Relatório inválido');
      }
    },
    enabled: !invalido,
  });

  function aplicarFiltros(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    setFiltros({
      dataInicio,
      dataFim,
      codigoOpInicio,
      codigoOpFim,
      secaoCodigo,
      tipoMp,
    });
  }

  if (invalido) {
    return (
      <section className="card">
        <p className="erro">Relatório não encontrado.</p>
        <Link to="/relatorios">Voltar aos relatórios</Link>
      </section>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow={`Relatório · ${referencia}`}
        title={titulo}
        actions={
          <>
            <Link to="/relatorios" className="btn btn-sm">
              Voltar
            </Link>
            <button
              type="button"
              className="btn btn-sm btn-primary"
              onClick={() => window.print()}
            >
              Imprimir
            </button>
          </>
        }
      />

      <section className="card">
      <form className="search-form" onSubmit={aplicarFiltros}>
        {(relatorio === 'op-abertas' ||
          relatorio === 'op-baixadas' ||
          relatorio === 'producao-setor' ||
          relatorio === 'programacao-sintetico') && (
          <>
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
          </>
        )}
        {(relatorio === 'op-abertas' || relatorio === 'op-baixadas') && (
          <>
            <input
              type="number"
              placeholder="OP de"
              value={codigoOpInicio}
              onChange={(e) => setCodigoOpInicio(e.target.value)}
            />
            <input
              type="number"
              placeholder="OP até"
              value={codigoOpFim}
              onChange={(e) => setCodigoOpFim(e.target.value)}
            />
          </>
        )}
        {relatorio === 'producao-setor' && (
          <input
            type="number"
            placeholder="Código seção"
            value={secaoCodigo}
            onChange={(e) => setSecaoCodigo(e.target.value)}
          />
        )}
        {relatorio === 'mp-estoque-critico' && (
          <select
            value={tipoMp}
            onChange={(e) =>
              setTipoMp(e.target.value as 'minimo' | 'maximo' | 'ambos')
            }
          >
            <option value="ambos">Abaixo mín. ou acima máx.</option>
            <option value="minimo">Somente abaixo do mínimo</option>
            <option value="maximo">Somente acima do máximo</option>
          </select>
        )}
        <button type="submit" className="btn btn-primary">
          Gerar
        </button>
      </form>

      {isLoading && <p>Carregando relatório...</p>}
      {isError && (
        <p className="erro">
          {(error as Error)?.message ?? 'Erro ao carregar relatório.'}
        </p>
      )}

      {data && relatorio === 'op-abertas' && (
        <>
          <dl className="detail-grid compact">
            <dt>OPs em aberto</dt>
            <dd>
              {(data as RelatorioOpResponse).totais.quantidadeOps.toLocaleString(
                'pt-BR',
              )}
            </dd>
            <dt>Peças programadas</dt>
            <dd>
              {(
                (data as RelatorioOpResponse).totais.pecasProgramadas ?? 0
              ).toLocaleString('pt-BR')}
            </dd>
          </dl>
          <OpTable dados={data as RelatorioOpResponse} baixadas={false} />
          <Pagination
            page={(data as RelatorioOpResponse).meta.page}
            totalPages={(data as RelatorioOpResponse).meta.totalPages}
            onPageChange={setPage}
          />
        </>
      )}

      {data && relatorio === 'op-baixadas' && (
        <>
          <dl className="detail-grid compact">
            <dt>OPs baixadas</dt>
            <dd>
              {(data as RelatorioOpResponse).totais.quantidadeOps.toLocaleString(
                'pt-BR',
              )}
            </dd>
            <dt>Peças produzidas</dt>
            <dd>
              {(
                (data as RelatorioOpResponse).totais.pecasProduzidas ?? 0
              ).toLocaleString('pt-BR')}
            </dd>
          </dl>
          <OpTable dados={data as RelatorioOpResponse} baixadas />
          <Pagination
            page={(data as RelatorioOpResponse).meta.page}
            totalPages={(data as RelatorioOpResponse).meta.totalPages}
            onPageChange={setPage}
          />
        </>
      )}

      {data && relatorio === 'producao-setor' && (
        <>
          <dl className="detail-grid compact">
            <dt>Setores</dt>
            <dd>{(data as RelatorioSetorResponse).totais.setores}</dd>
            <dt>Qtde produzida</dt>
            <dd>
              {(data as RelatorioSetorResponse).totais.qtdeProduzida.toLocaleString(
                'pt-BR',
              )}
            </dd>
            <dt>Operações baixadas</dt>
            <dd>
              {(
                data as RelatorioSetorResponse
              ).totais.operacoesBaixadas.toLocaleString('pt-BR')}
            </dd>
          </dl>
          <table className="data-table">
            <thead>
              <tr>
                <th>Seção</th>
                <th>Descrição</th>
                <th>Qtde produzida</th>
                <th>Operações</th>
              </tr>
            </thead>
            <tbody>
              {(data as RelatorioSetorResponse).itens.map((item) => (
                <tr key={item.secaoCodigo}>
                  <td>{item.secaoCodigo}</td>
                  <td>{item.secaoDescricao ?? '—'}</td>
                  <td>{item.qtdeProduzida.toLocaleString('pt-BR')}</td>
                  <td>{item.operacoesBaixadas.toLocaleString('pt-BR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {data && relatorio === 'mp-estoque-critico' && (
        <>
          <dl className="detail-grid compact">
            <dt>Abaixo do mínimo</dt>
            <dd>{(data as RelatorioMpResponse).totais.abaixoMinimo}</dd>
            <dt>Acima do máximo</dt>
            <dd>{(data as RelatorioMpResponse).totais.acimaMaximo}</dd>
          </dl>
          <table className="data-table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Descrição</th>
                <th>Saldo</th>
                <th>Mín</th>
                <th>Máx</th>
                <th>Diferença</th>
                <th>Situação</th>
              </tr>
            </thead>
            <tbody>
              {(data as RelatorioMpResponse).data.map((mp) => (
                <tr key={mp.id}>
                  <td>
                    <Link to={`/materia-prima/${mp.id}`}>{mp.codigo}</Link>
                  </td>
                  <td>{mp.descricao ?? '—'}</td>
                  <td>{mp.quantidade.toLocaleString('pt-BR')}</td>
                  <td>{mp.estoqueMin?.toLocaleString('pt-BR') ?? '—'}</td>
                  <td>{mp.estoqueMax?.toLocaleString('pt-BR') ?? '—'}</td>
                  <td>{mp.diferenca.toLocaleString('pt-BR')}</td>
                  <td>
                    {mp.situacao === 'abaixo_minimo'
                      ? 'Abaixo mín.'
                      : 'Acima máx.'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination
            page={(data as RelatorioMpResponse).meta.page}
            totalPages={(data as RelatorioMpResponse).meta.totalPages}
            onPageChange={setPage}
          />
        </>
      )}

      {data && relatorio === 'programacao-sintetico' && (
        <>
          <dl className="detail-grid compact">
            <dt>Meses</dt>
            <dd>{(data as RelatorioProgramacaoResponse).totais.meses}</dd>
            <dt>Programado</dt>
            <dd>
              {(
                data as RelatorioProgramacaoResponse
              ).totais.programado.toLocaleString('pt-BR')}
            </dd>
            <dt>Entregue</dt>
            <dd>
              {(
                data as RelatorioProgramacaoResponse
              ).totais.entregue.toLocaleString('pt-BR')}
            </dd>
            <dt>A produzir</dt>
            <dd>
              {(
                data as RelatorioProgramacaoResponse
              ).totais.aProduzir.toLocaleString('pt-BR')}
            </dd>
          </dl>
          <table className="data-table">
            <thead>
              <tr>
                <th>Mês</th>
                <th>Registros</th>
                <th>Programado</th>
                <th>Entregue</th>
                <th>A produzir</th>
              </tr>
            </thead>
            <tbody>
              {(data as RelatorioProgramacaoResponse).itens.map((item) => (
                <tr key={item.mes}>
                  <td>{item.mes}</td>
                  <td>{item.registros.toLocaleString('pt-BR')}</td>
                  <td>{item.programado.toLocaleString('pt-BR')}</td>
                  <td>{item.entregue.toLocaleString('pt-BR')}</td>
                  <td>{item.aProduzir.toLocaleString('pt-BR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </section>
    </>
  );
}

function OpTable({
  dados,
  baixadas,
}: {
  dados: RelatorioOpResponse;
  baixadas: boolean;
}) {
  return (
    <table className="data-table">
      <thead>
        <tr>
          <th>OP</th>
          <th>Produto</th>
          <th>Qtde</th>
          <th>Abertura</th>
          <th>Cliente</th>
          {baixadas && <th>Baixa</th>}
          {baixadas && <th>Produzidas</th>}
        </tr>
      </thead>
      <tbody>
        {dados.data.map((op) => (
          <tr key={op.codigo}>
            <td>
              <Link to={`/ordens-producao/${op.codigo}`}>{op.codigo}</Link>
            </td>
            <td>
              {op.produtoCodigoFormatado ?? op.produtoCodigo}
              {op.produtoDescricao && (
                <div className="muted">{op.produtoDescricao}</div>
              )}
            </td>
            <td>{op.quantidade.toLocaleString('pt-BR')}</td>
            <td>{formatarData(op.dataAbertura)}</td>
            <td>{op.clienteNome ?? '—'}</td>
            {baixadas && (
              <td>{formatarData(op.baixa?.dataBaixa ?? null)}</td>
            )}
            {baixadas && (
              <td>
                {(op.baixa?.pecasProduzidas ?? 0).toLocaleString('pt-BR')}
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
