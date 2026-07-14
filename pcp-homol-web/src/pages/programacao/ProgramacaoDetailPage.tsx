import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FormEvent, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  obterProgramacao,
  registrarEntregaProgramacao,
} from '../../api/programacao';
import { PageHeader } from '../../components/PageHeader';
import { LoadingState } from '../../components/StateMessage';

function formatarData(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('pt-BR');
}

export function ProgramacaoDetailPage() {
  const { id } = useParams();
  const progId = Number(id);
  const queryClient = useQueryClient();
  const [qtdeEntrega, setQtdeEntrega] = useState(0);

  const { data: prog, isLoading, isError, error } = useQuery({
    queryKey: ['programacao', progId],
    queryFn: () => obterProgramacao(progId),
    enabled: !Number.isNaN(progId),
  });

  const entrega = useMutation({
    mutationFn: () => registrarEntregaProgramacao(progId, qtdeEntrega),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['programacao', progId] });
      queryClient.invalidateQueries({ queryKey: ['programacao'] });
      queryClient.invalidateQueries({ queryKey: ['programacao-resumo'] });
      queryClient.invalidateQueries({ queryKey: ['programacao-atrasos'] });
      setQtdeEntrega(0);
    },
  });

  function submitEntrega(e: FormEvent) {
    e.preventDefault();
    entrega.mutate();
  }

  if (isLoading) return <LoadingState message="Carregando programação…" />;
  if (isError) return <p className="erro">{(error as Error).message}</p>;
  if (!prog) return null;

  const podeEntregar = prog.saldoPendente > 0;

  return (
    <>
      <PageHeader
        eyebrow="Programação"
        title={`Entrega #${prog.id}`}
        subtitle={prog.desenhoCliente ?? prog.produtoCodigoFormatado ?? undefined}
        actions={
          <>
            {prog.atrasado && (
              <span className="badge badge-warning">Atrasado</span>
            )}
            <Link to="/programacao" className="link">
              Voltar
            </Link>
          </>
        }
      />

      <section className="card">
      {prog.atrasado && (
        <p className="erro">Atenção: data vencida com quantidade a produzir.</p>
      )}

      <dl className="detail-grid">
        <dt>Data</dt>
        <dd>{formatarData(prog.dataProgramacao)}</dd>
        <dt>Produto</dt>
        <dd className="mono">{prog.produtoCodigoFormatado ?? '—'}</dd>
        <dt>Descrição</dt>
        <dd>{prog.produtoDescricao ?? '—'}</dd>
        <dt>Desenho cliente</dt>
        <dd className="mono">{prog.desenhoCliente ?? '—'}</dd>
        <dt>Plano</dt>
        <dd>{prog.plano ?? '—'}</dd>
        <dt>Flag</dt>
        <dd>{prog.flag ?? '—'}</dd>
        <dt>Pedido</dt>
        <dd>{prog.pedidoRef ?? '—'}</dd>
        <dt>Pedido cliente</dt>
        <dd>{prog.pedidoRef2 ?? '—'}</dd>
        <dt>Quantidade programada</dt>
        <dd>{prog.quantidade.toLocaleString('pt-BR')}</dd>
        <dt>Entregue</dt>
        <dd>{prog.qtdeEntregue.toLocaleString('pt-BR')}</dd>
        <dt>A produzir</dt>
        <dd>{prog.qtdeAProduzir.toLocaleString('pt-BR')}</dd>
        <dt>Saldo pendente</dt>
        <dd>{prog.saldoPendente.toLocaleString('pt-BR')}</dd>
        <dt>Devolvido</dt>
        <dd>{prog.devolvido ? 'Sim' : 'Não'}</dd>
      </dl>

      {podeEntregar && (
        <>
          <h3>Registrar entrega</h3>
          <form className="form-grid" onSubmit={submitEntrega}>
            <label>
              Quantidade entregue
              <input
                type="number"
                min={1}
                max={prog.saldoPendente}
                value={qtdeEntrega || ''}
                onChange={(e) => setQtdeEntrega(Number(e.target.value))}
                required
              />
            </label>
            <div className="form-actions">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={entrega.isPending}
              >
                {entrega.isPending ? 'Gravando...' : 'Registrar entrega'}
              </button>
            </div>
            {entrega.isError && (
              <p className="erro">{(entrega.error as Error).message}</p>
            )}
          </form>
        </>
      )}
    </section>
    </>
  );
}
