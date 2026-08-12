import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { obterEmissaoOp } from '../../api/ordens-producao';

function formatarData(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('pt-BR');
}

export function OrdemProducaoEmissaoPage() {
  const { id } = useParams();
  const opId = Number(id);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['op-emissao', opId],
    queryFn: () => obterEmissaoOp(opId),
    enabled: !Number.isNaN(opId),
  });

  if (isLoading) return <p>Carregando emissão...</p>;
  if (isError) return <p className="erro">{(error as Error).message}</p>;
  if (!data) return null;

  const { op, tipoLabel, operacoes, materiasPrimas, requisicoes } = data;
  const hoje = new Date().toLocaleDateString('pt-BR');

  return (
    <div className="emissao-wrap">
      <div className="emissao-toolbar no-print">
        <Link to={`/ordens-producao/${op.id}`} className="link">
          Voltar
        </Link>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => window.print()}
        >
          Imprimir
        </button>
      </div>

      <article className="emissao-doc">
        <header className="emissao-header">
          <h1>Ordem de Produção</h1>
          <p className="emissao-empresa">FANANDRI — PCP Homologação</p>
        </header>

        <section className="emissao-bloco">
          <div className="emissao-grid-2">
            <div>
              <strong>OP nº</strong>
              <div className="emissao-valor mono">{op.codigo}</div>
            </div>
            <div>
              <strong>Tipo</strong>
              <div className="emissao-valor">{tipoLabel}</div>
            </div>
            <div>
              <strong>Desenho cliente</strong>
              <div className="emissao-valor mono">{op.produtoCodigo}</div>
            </div>
            <div>
              <strong>Código interno</strong>
              <div className="emissao-valor mono">
                {op.produtoCodigoFormatado ?? '—'}
              </div>
            </div>
            <div>
              <strong>Descrição</strong>
              <div className="emissao-valor">{op.produtoDescricao ?? '—'}</div>
            </div>
            <div>
              <strong>Quantidade</strong>
              <div className="emissao-valor">
                {op.quantidade.toLocaleString('pt-BR')}
              </div>
            </div>
            <div>
              <strong>Abertura</strong>
              <div className="emissao-valor">
                {formatarData(op.dataAbertura)}
                {op.horaAbertura ? ` ${op.horaAbertura}` : ''}
              </div>
            </div>
            <div>
              <strong>Cliente</strong>
              <div className="emissao-valor">{op.clienteNome ?? '—'}</div>
            </div>
          </div>
        </section>

        {materiasPrimas.length > 0 && (
          <section className="emissao-bloco">
            <h2>Matérias-primas</h2>
            {materiasPrimas.map((mp) => (
              <div className="emissao-mp-bloco" key={mp.codigo}>
                <div>
                  <span className="emissao-mp-rotulo">Cod.Mat.Pri.:</span>{' '}
                  <span className="mono">{mp.codigo}</span>{' '}
                  {mp.descricao ?? '—'}
                </div>
                {mp.descricaoComplementar && (
                  <small className="emissao-obs emissao-mp-compl">
                    {mp.descricaoComplementar}
                  </small>
                )}
                <small className="emissao-mp-peso">
                  Peso:{' '}
                  {mp.peso != null
                    ? `${mp.peso.toLocaleString('pt-BR')}${mp.unidade ? ` ${mp.unidade}` : ''}`
                    : '—'}
                </small>
              </div>
            ))}
          </section>
        )}

        <section className="emissao-bloco">
          <h2>Roteiro de produção</h2>
          <table className="emissao-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Operação</th>
                <th>Seção</th>
                <th>Prep.</th>
                <th>Prod.</th>
                <th>Equipamento</th>
                <th>Ferramenta</th>
                <th>Encerramento</th>
                <th>Aprovação</th>
              </tr>
            </thead>
            <tbody>
              {operacoes.map((o) => (
                <tr key={o.numeroOperacao}>
                  <td>{o.numeroOperacao}</td>
                  <td>
                    <div>{o.descricao ?? '—'}</div>
                    {o.observacao1 && (
                      <small className="emissao-obs">{o.observacao1}</small>
                    )}
                  </td>
                  <td>{o.secaoDescricao ?? o.secaoCodigo ?? '—'}</td>
                  <td>{o.preparacao}</td>
                  <td>{o.producao}</td>
                  <td>{o.equipamento}</td>
                  <td>{o.ferramenta ?? '—'}</td>
                  <td>{formatarData(o.dataEncerramento)}</td>
                  <td>
                    <div className="emissao-selo">
                      <span>Início:</span>
                      <span>Término:</span>
                      <span>Qtde:</span>
                      <span>Liberado por:</span>
                      <span>Data: ___/___/___</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <footer className="emissao-footer">
          <small>
            Emitido em{' '}
            {new Date(data.emitidoEm).toLocaleString('pt-BR')} — sistema PCP
            Homologação
          </small>
        </footer>

        {requisicoes.map((r) => (
          <section key={r.numeroFormatado} className="emissao-requisicao">
            <header className="emissao-requisicao-header">
              <div>
                <strong>INDUSTRIA METALURGICA FANANDRI LTDA</strong>
                <div>CONTROLE PRODUÇÃO</div>
              </div>
              <div>DATA: {hoje}</div>
            </header>
            <div className="emissao-requisicao-titulo">
              <div>
                REQUISIÇÃO DE MATERIAL DE ESTOQUE No.{' '}
                <span className="mono">{r.numeroFormatado}</span>
              </div>
              <div>
                OP No.: <span className="mono">{op.codigo}</span>
              </div>
            </div>
            <table className="emissao-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Código</th>
                  <th>Descrição</th>
                  <th>Un.</th>
                  <th>Quantidade</th>
                  <th>Prazo nec.</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>{String(r.itemOrdem).padStart(2, '0')}</td>
                  <td>{r.codigo}</td>
                  <td>
                    <div>{r.descricao ?? '—'}</div>
                    {r.descricaoComplementar && (
                      <small className="emissao-obs">
                        {r.descricaoComplementar}
                      </small>
                    )}
                  </td>
                  <td>{r.unidade ?? '—'}</td>
                  <td>
                    {r.quantidade != null
                      ? r.quantidade.toLocaleString('pt-BR')
                      : '—'}
                  </td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          </section>
        ))}
      </article>
    </div>
  );
}
