import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FormEvent, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  baixarMateriaPrimaOp,
  baixarOperacaoOp,
  encerrarOp,
  obterBaixasMpOp,
  obterBaixasOp,
  obterOp,
} from '../../api/ordens-producao';
import { PageHeader } from '../../components/PageHeader';
import { LoadingState } from '../../components/StateMessage';

function formatarData(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('pt-BR');
}

export function OrdemProducaoDetailPage() {
  const { id } = useParams();
  const opId = Number(id);
  const queryClient = useQueryClient();

  const [operacaoSelecionada, setOperacaoSelecionada] = useState<number | null>(
    null,
  );
  const [qtdeSaida, setQtdeSaida] = useState(0);
  const [pecasProduzidas, setPecasProduzidas] = useState(0);
  const [mpConsumida, setMpConsumida] = useState(0);
  const [rolos, setRolos] = useState(0);
  const [baixadaMp, setBaixadaMp] = useState(false);
  const [baixadaProduto, setBaixadaProduto] = useState(false);
  const [mpSelecionada, setMpSelecionada] = useState<number | ''>('');
  const [qtdeMp, setQtdeMp] = useState(0);
  const [qtdeRolosMp, setQtdeRolosMp] = useState(0);

  const { data: op, isLoading, isError, error } = useQuery({
    queryKey: ['op', opId],
    queryFn: () => obterOp(opId),
    enabled: !Number.isNaN(opId),
  });

  const { data: baixas, isLoading: carregandoBaixas } = useQuery({
    queryKey: ['op-baixas', opId],
    queryFn: () => obterBaixasOp(opId),
    enabled: !Number.isNaN(opId),
  });

  const { data: baixasMp, isLoading: carregandoBaixasMp } = useQuery({
    queryKey: ['op-baixas-mp', opId],
    queryFn: () => obterBaixasMpOp(opId),
    enabled: !Number.isNaN(opId),
  });

  const invalidar = () => {
    queryClient.invalidateQueries({ queryKey: ['op', opId] });
    queryClient.invalidateQueries({ queryKey: ['op-baixas', opId] });
    queryClient.invalidateQueries({ queryKey: ['op-baixas-mp', opId] });
  };

  const baixarOperacao = useMutation({
    mutationFn: () => {
      if (operacaoSelecionada == null) {
        throw new Error('Selecione uma operação');
      }
      return baixarOperacaoOp(opId, {
        numeroOperacao: operacaoSelecionada,
        qtdeSaida,
      });
    },
    onSuccess: () => {
      invalidar();
      setOperacaoSelecionada(null);
      setQtdeSaida(0);
    },
  });

  const encerrar = useMutation({
    mutationFn: () =>
      encerrarOp(opId, {
        pecasProduzidas,
        mpConsumida,
        rolos,
        baixadaMp,
        baixadaProduto,
      }),
    onSuccess: invalidar,
  });

  const baixarMp = useMutation({
    mutationFn: () => {
      if (mpSelecionada === '') {
        throw new Error('Selecione uma matéria-prima');
      }
      return baixarMateriaPrimaOp(opId, {
        materiaPrimaId: mpSelecionada,
        quantidade: qtdeMp,
        qtdeRolos: qtdeRolosMp || undefined,
      });
    },
    onSuccess: () => {
      invalidar();
      setMpSelecionada('');
      setQtdeMp(0);
      setQtdeRolosMp(0);
    },
  });

  function submitBaixaOperacao(e: FormEvent) {
    e.preventDefault();
    baixarOperacao.mutate();
  }

  function submitEncerrar(e: FormEvent) {
    e.preventDefault();
    encerrar.mutate();
  }

  function submitBaixaMp(e: FormEvent) {
    e.preventDefault();
    baixarMp.mutate();
  }

  const mpsDisponiveis =
    baixasMp?.materiasPrimasSugeridas.filter((m) => m.materiaPrimaId) ?? [];

  if (isLoading) return <LoadingState message="Carregando ordem de produção…" />;
  if (isError) {
    return <p className="erro">{(error as Error).message}</p>;
  }
  if (!op) return null;

  const opAberta = !op.baixada;
  const operacoesSemBaixa =
    baixas?.operacoes.filter((o) => !o.baixa) ?? [];

  return (
    <>
      <PageHeader
        eyebrow="Ordem de produção"
        title={`OP ${op.codigo}`}
        subtitle={op.produtoDescricao ?? op.produtoCodigo}
        actions={
          <>
            <span
              className={`badge ${op.baixada ? 'badge-neutral' : 'badge-success'}`}
            >
              {op.baixada ? 'Baixada' : 'Aberta'}
            </span>
            {opAberta && (
              <Link to={`/ordens-producao/${op.id}/emissao`} className="btn">
                Emitir OP
              </Link>
            )}
            <Link to="/ordens-producao" className="link">
              Voltar
            </Link>
          </>
        }
      />

      <section className="card">
      <dl className="detail-grid">
        <dt>Produto (desenho)</dt>
        <dd className="mono">{op.produtoCodigo}</dd>
        <dt>Descrição</dt>
        <dd>{op.produtoDescricao ?? '—'}</dd>
        <dt>Código interno</dt>
        <dd className="mono">{op.produtoCodigoFormatado ?? '—'}</dd>
        <dt>Quantidade</dt>
        <dd>{op.quantidade.toLocaleString('pt-BR')}</dd>
        <dt>Data abertura</dt>
        <dd>
          {formatarData(op.dataAbertura)}
          {op.horaAbertura ? ` às ${op.horaAbertura}` : ''}
        </dd>
        <dt>Tipo</dt>
        <dd>{op.tipo ?? '—'}</dd>
        <dt>Cliente</dt>
        <dd>{op.clienteNome ?? '—'}</dd>
        <dt>Status</dt>
        <dd>
          {op.baixada ? 'Baixada' : 'Aberta'}
          {op.baixadaMp ? ' · MP baixada' : ''}
          {op.baixadaProduto ? ' · Produto baixado' : ''}
        </dd>
      </dl>

      {op.operacoes && op.operacoes.length > 0 && (
        <>
          <h3>Operações</h3>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Equipamento</th>
                  <th>Ferramenta</th>
                  <th>Encerramento</th>
                </tr>
              </thead>
              <tbody>
                {op.operacoes.map((o) => (
                  <tr key={o.id}>
                    <td>{o.numeroOperacao}</td>
                    <td className="mono">
                      {o.equipamentoGrupo != null && o.equipamentoCodigo != null
                        ? `${String(o.equipamentoGrupo).padStart(2, '0')}-${String(o.equipamentoCodigo).padStart(4, '0')}`
                        : '—'}
                    </td>
                    <td>
                      {o.ferramentaNumero
                        ? `${o.ferramentaFabrica ?? ''} ${o.ferramentaNumero}`.trim()
                        : '—'}
                    </td>
                    <td>{formatarData(o.dataEncerramento)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <h3>Baixas</h3>
      {carregandoBaixas ? (
        <p>Carregando baixas...</p>
      ) : baixas ? (
        <>
          {baixas.consolidada ? (
            <dl className="detail-grid">
              <dt>Baixa consolidada</dt>
              <dd>
                {formatarData(baixas.consolidada.dataBaixa)}
                {baixas.consolidada.horaBaixa
                  ? ` às ${baixas.consolidada.horaBaixa}`
                  : ''}
              </dd>
              <dt>Peças produzidas</dt>
              <dd>
                {baixas.consolidada.pecasProduzidas.toLocaleString('pt-BR')}
              </dd>
              <dt>MP consumida</dt>
              <dd>{baixas.consolidada.mpConsumida.toLocaleString('pt-BR')}</dd>
              <dt>Rolos</dt>
              <dd>{baixas.consolidada.rolos.toLocaleString('pt-BR')}</dd>
            </dl>
          ) : (
            <p className="muted">Nenhuma baixa consolidada registrada.</p>
          )}

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Op.</th>
                  <th>Qtde saída</th>
                  <th>Data fim</th>
                  <th>Estoque</th>
                </tr>
              </thead>
              <tbody>
                {baixas.operacoes.map((o) => (
                  <tr key={o.numeroOperacao}>
                    <td>{o.numeroOperacao}</td>
                    <td>
                      {o.baixa
                        ? o.baixa.qtdeSaida.toLocaleString('pt-BR')
                        : '—'}
                    </td>
                    <td>
                      {o.baixa
                        ? `${formatarData(o.baixa.dataFim)}${o.baixa.horaFim ? ` ${o.baixa.horaFim}` : ''}`
                        : '—'}
                    </td>
                    <td>{o.baixa?.atualizouEstoque ? 'Sim' : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {opAberta && (
            <>
              <h4>Baixar operação (PC1132)</h4>
              <form className="form-grid" onSubmit={submitBaixaOperacao}>
                <label>
                  Operação
                  <select
                    value={operacaoSelecionada ?? ''}
                    onChange={(e) =>
                      setOperacaoSelecionada(
                        e.target.value ? Number(e.target.value) : null,
                      )
                    }
                    required
                  >
                    <option value="">Selecione...</option>
                    {operacoesSemBaixa.map((o) => (
                      <option
                        key={o.numeroOperacao}
                        value={o.numeroOperacao}
                      >
                        Operação {o.numeroOperacao}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Quantidade produzida
                  <input
                    type="number"
                    min={0}
                    value={qtdeSaida}
                    onChange={(e) => setQtdeSaida(Number(e.target.value))}
                    required
                  />
                </label>
                <div className="form-actions">
                  <button
                    type="submit"
                    className="btn primary"
                    disabled={baixarOperacao.isPending}
                  >
                    {baixarOperacao.isPending
                      ? 'Gravando...'
                      : 'Baixar operação'}
                  </button>
                </div>
                {baixarOperacao.isError && (
                  <p className="erro">
                    {(baixarOperacao.error as Error).message}
                  </p>
                )}
              </form>

              <h4>Encerrar OP (PC1028)</h4>
              <form className="form-grid" onSubmit={submitEncerrar}>
                <label>
                  Peças produzidas
                  <input
                    type="number"
                    min={0}
                    value={pecasProduzidas}
                    onChange={(e) =>
                      setPecasProduzidas(Number(e.target.value))
                    }
                    required
                  />
                </label>
                <label>
                  MP consumida
                  <input
                    type="number"
                    min={0}
                    value={mpConsumida}
                    onChange={(e) => setMpConsumida(Number(e.target.value))}
                  />
                </label>
                <label>
                  Rolos
                  <input
                    type="number"
                    min={0}
                    value={rolos}
                    onChange={(e) => setRolos(Number(e.target.value))}
                  />
                </label>
                <label className="checkbox">
                  <input
                    type="checkbox"
                    checked={baixadaMp}
                    onChange={(e) => setBaixadaMp(e.target.checked)}
                  />
                  MP baixada
                </label>
                <label className="checkbox">
                  <input
                    type="checkbox"
                    checked={baixadaProduto}
                    onChange={(e) => setBaixadaProduto(e.target.checked)}
                  />
                  Produto baixado
                </label>
                <div className="form-actions">
                  <button
                    type="submit"
                    className="btn primary"
                    disabled={encerrar.isPending}
                  >
                    {encerrar.isPending ? 'Encerrando...' : 'Encerrar OP'}
                  </button>
                </div>
                {encerrar.isError && (
                  <p className="erro">{(encerrar.error as Error).message}</p>
                )}
              </form>
            </>
          )}
        </>
      ) : null}

      <h3>Baixa de matéria-prima</h3>
      {carregandoBaixasMp ? (
        <p>Carregando baixas de MP...</p>
      ) : baixasMp ? (
        <>
          {baixasMp.materiasPrimasSugeridas.length > 0 && (
            <>
              <h4>MPs do roteiro (processo produtivo)</h4>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Código</th>
                      <th>Descrição</th>
                      <th>Peso ref.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {baixasMp.materiasPrimasSugeridas.map((m) => (
                      <tr key={m.codigo}>
                        <td className="mono">{m.codigo}</td>
                        <td>{m.descricao ?? '—'}</td>
                        <td>{m.peso ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {baixasMp.baixas.length > 0 ? (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>MP</th>
                    <th>Descrição</th>
                    <th>Quantidade</th>
                    <th>Rolos</th>
                    <th>Data</th>
                  </tr>
                </thead>
                <tbody>
                  {baixasMp.baixas.map((b) => (
                    <tr key={b.id}>
                      <td className="mono">{b.materiaPrimaCodigo}</td>
                      <td>{b.materiaPrimaDescricao}</td>
                      <td>{Number(b.quantidade).toLocaleString('pt-BR')}</td>
                      <td>{b.qtdeRolos}</td>
                      <td>{formatarData(b.dataBaixa)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="muted">Nenhuma baixa de MP registrada nesta OP.</p>
          )}

          {opAberta && mpsDisponiveis.length > 0 && (
            <>
              <h4>Baixar MP (PC1109)</h4>
              <form className="form-grid" onSubmit={submitBaixaMp}>
                <label>
                  Matéria-prima
                  <select
                    value={mpSelecionada}
                    onChange={(e) =>
                      setMpSelecionada(
                        e.target.value ? Number(e.target.value) : '',
                      )
                    }
                    required
                  >
                    <option value="">Selecione...</option>
                    {mpsDisponiveis.map((m) => (
                      <option
                        key={m.materiaPrimaId!}
                        value={m.materiaPrimaId!}
                      >
                        {m.codigo} — {m.descricao ?? 'sem descrição'}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Quantidade
                  <input
                    type="number"
                    min={0.01}
                    step={0.01}
                    value={qtdeMp || ''}
                    onChange={(e) => setQtdeMp(Number(e.target.value))}
                    required
                  />
                </label>
                <label>
                  Rolos
                  <input
                    type="number"
                    min={0}
                    value={qtdeRolosMp}
                    onChange={(e) => setQtdeRolosMp(Number(e.target.value))}
                  />
                </label>
                <div className="form-actions">
                  <button
                    type="submit"
                    className="btn primary"
                    disabled={baixarMp.isPending}
                  >
                    {baixarMp.isPending ? 'Gravando...' : 'Baixar MP'}
                  </button>
                </div>
                {baixarMp.isError && (
                  <p className="erro">{(baixarMp.error as Error).message}</p>
                )}
              </form>
            </>
          )}

          {baixasMp.movimentos.length > 0 && (
            <>
              <h4>Movimentos vinculados</h4>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Tipo</th>
                      <th>MP</th>
                      <th>Qtde</th>
                      <th>Data</th>
                      <th>Origem</th>
                    </tr>
                  </thead>
                  <tbody>
                    {baixasMp.movimentos.map((m) => (
                      <tr key={m.id}>
                        <td>{m.tipo === 'B' ? 'Baixa' : m.tipo}</td>
                        <td className="mono">{m.materiaPrimaCodigo}</td>
                        <td>{Number(m.quantidade).toLocaleString('pt-BR')}</td>
                        <td>{formatarData(m.dataMovimento)}</td>
                        <td>{m.origem}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      ) : null}
    </section>
    </>
  );
}
