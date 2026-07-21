import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { obterCliente } from '../../api/clientes';
import { PageHeader } from '../../components/PageHeader';

/** Detalhe somente leitura de um cliente (legado PC1004). */
export function ClienteDetailPage() {
  const { id } = useParams();
  const clienteId = Number(id);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['cliente', clienteId],
    queryFn: () => obterCliente(clienteId),
    enabled: Number.isFinite(clienteId) && clienteId > 0,
  });

  if (isLoading) {
    return <p>Carregando cliente…</p>;
  }

  if (isError || !data) {
    return (
      <p className="erro">
        {(error as Error)?.message ?? 'Cliente não encontrado'}
      </p>
    );
  }

  const nome = [data.empresa.trim(), data.sufixo?.trim()]
    .filter(Boolean)
    .join(' — ');

  const telefone =
    data.telefone1 &&
    [data.ddd ? `(${data.ddd})` : null, data.telefone1]
      .filter(Boolean)
      .join(' ');

  return (
    <>
      <PageHeader
        eyebrow="Cadastros"
        title={nome}
        subtitle={`Código ${data.codigo} · origem PCPA04I`}
        actions={
          <Link to="/clientes" className="link">
            Voltar à lista
          </Link>
        }
      />

      <section className="card">
        <h2>Dados cadastrais</h2>
        <dl className="detail-grid">
          <dt>Código</dt>
          <dd className="mono">{data.codigo}</dd>

          <dt>Empresa</dt>
          <dd>{data.empresa}</dd>

          <dt>Sufixo</dt>
          <dd>{data.sufixo ?? '—'}</dd>

          <dt>CNPJ / CGC</dt>
          <dd className="mono">{data.cgc ?? '—'}</dd>

          <dt>Inscrição estadual</dt>
          <dd className="mono">{data.inscricaoEstadual ?? '—'}</dd>

          <dt>CCM</dt>
          <dd className="mono">{data.ccm ?? '—'}</dd>

          <dt>Tipo</dt>
          <dd>{data.tipo ?? '—'}</dd>

          <dt>Vendedor</dt>
          <dd>{data.vendedorCodigo ?? '—'}</dd>
        </dl>
      </section>

      <section className="card">
        <h2>Endereço e contato</h2>
        <dl className="detail-grid">
          <dt>Endereço</dt>
          <dd>{data.endereco ?? '—'}</dd>

          <dt>Bairro</dt>
          <dd>{data.bairro ?? '—'}</dd>

          <dt>Cidade / UF</dt>
          <dd>
            {[data.cidade, data.estado].filter(Boolean).join(' / ') || '—'}
          </dd>

          <dt>CEP</dt>
          <dd className="mono">{data.cep ?? '—'}</dd>

          <dt>Endereço cobrança</dt>
          <dd>{data.enderecoCobranca ?? '—'}</dd>

          <dt>Endereço entrega</dt>
          <dd>{data.enderecoEntrega ?? '—'}</dd>

          <dt>Telefone</dt>
          <dd>{telefone || '—'}</dd>

          <dt>Telefone 2</dt>
          <dd>{data.telefone2 ?? '—'}</dd>

          <dt>Fax</dt>
          <dd>{data.fax ?? '—'}</dd>

          <dt>Contato 1</dt>
          <dd>{data.contato1 ?? '—'}</dd>

          <dt>Contato 2</dt>
          <dd>{data.contato2 ?? '—'}</dd>
        </dl>
      </section>

      <p className="muted">
        Nesta homologação o cadastro é somente consulta. Na OP, o nome do
        cliente ainda é gravado como texto (como no COBOL PCPA28II).
      </p>
    </>
  );
}
