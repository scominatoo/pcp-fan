import { useMutation } from '@tanstack/react-query';
import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { criarProgramacao } from '../../api/programacao';
import { PageHeader } from '../../components/PageHeader';

export function ProgramacaoFormPage() {
  const navigate = useNavigate();
  const [dataProgramacao, setDataProgramacao] = useState('');
  const [desenhoCliente, setDesenhoCliente] = useState('');
  const [quantidade, setQuantidade] = useState(1);
  const [plano, setPlano] = useState('');
  const [pedidoRef, setPedidoRef] = useState('');
  const [pedidoRef2, setPedidoRef2] = useState('');

  const salvar = useMutation({
    mutationFn: () =>
      criarProgramacao({
        dataProgramacao,
        desenhoCliente: desenhoCliente.trim() || undefined,
        quantidade,
        plano: plano.trim() || undefined,
        pedidoRef: pedidoRef.trim() || undefined,
        pedidoRef2: pedidoRef2.trim() || undefined,
        flag: 'P',
      }),
    onSuccess: (row) => navigate(`/programacao/${row.id}`),
  });

  function submit(e: FormEvent) {
    e.preventDefault();
    salvar.mutate();
  }

  return (
    <>
      <PageHeader
        eyebrow="Programação"
        title="Nova entrega programada"
        actions={
          <Link to="/programacao" className="link">
            Voltar
          </Link>
        }
      />

      <section className="card">
      <form className="form-grid" onSubmit={submit}>
        <label>
          Data programada
          <input
            type="date"
            value={dataProgramacao}
            onChange={(e) => setDataProgramacao(e.target.value)}
            required
          />
        </label>
        <label>
          Desenho do cliente
          <input
            value={desenhoCliente}
            onChange={(e) => setDesenhoCliente(e.target.value)}
            placeholder="Ex.: 90531014"
          />
        </label>
        <label>
          Quantidade
          <input
            type="number"
            min={1}
            value={quantidade}
            onChange={(e) => setQuantidade(Number(e.target.value))}
            required
          />
        </label>
        <label>
          Plano
          <input
            value={plano}
            onChange={(e) => setPlano(e.target.value)}
            maxLength={2}
          />
        </label>
        <label>
          Pedido (ref. interna)
          <input
            value={pedidoRef}
            onChange={(e) => setPedidoRef(e.target.value)}
            maxLength={15}
          />
        </label>
        <label>
          Pedido cliente
          <input
            value={pedidoRef2}
            onChange={(e) => setPedidoRef2(e.target.value)}
            maxLength={15}
          />
        </label>
        <div className="form-actions">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={salvar.isPending}
          >
            {salvar.isPending ? 'Gravando...' : 'Salvar'}
          </button>
        </div>
        {salvar.isError && (
          <p className="erro">{(salvar.error as Error).message}</p>
        )}
      </form>
    </section>
    </>
  );
}
