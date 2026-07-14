import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { obterProcesso } from '../../api/processos';
import { PageHeader } from '../../components/PageHeader';

/** Formata segundos do legado em mm:ss (preparação / produção). */
function formatarSegundos(seg: number | null | undefined): string {
  if (seg == null || Number.isNaN(seg)) return '—';
  const m = Math.floor(seg / 60);
  const s = seg % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

type MpItem = {
  classeLetra?: string;
  classeNumero?: number;
  itemCodigo?: number;
  peso?: number | string | null;
};

function asMpList(raw: unknown): MpItem[] {
  return Array.isArray(raw) ? (raw as MpItem[]) : [];
}

export function ProcessoDetailPage() {
  const { id } = useParams();
  const processoId = Number(id);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['processo', processoId],
    queryFn: () => obterProcesso(processoId),
    enabled: Number.isFinite(processoId) && processoId > 0,
  });

  const mps = asMpList(data?.materiasPrimas);
  const mpsExtra = asMpList(data?.materiasPrimasComplemento);

  return (
    <>
      <PageHeader
        eyebrow="Cadastros"
        title={
          data
            ? `Processo ${data.produtoCodigo}`
            : 'Processo produtivo'
        }
        subtitle={data?.produto?.descricao ?? 'Roteiro de operações (PC1070)'}
        actions={
          <Link to="/processos" className="link">
            Voltar
          </Link>
        }
      />

      <section className="card">
        {isLoading && <p>Carregando...</p>}
        {isError && (
          <p className="erro">
            {(error as Error).message ?? 'Erro ao carregar'}
          </p>
        )}

        {data && (
          <>
            <div className="form-row">
              <p className="meta">
                Desenho cliente:{' '}
                <strong className="mono">
                  {data.produto?.desenhoCliente ?? data.produtoCodigo}
                </strong>
              </p>
              <p className="meta">
                Sparta:{' '}
                <strong className="mono">
                  {data.produto?.desenhoSparta ?? '—'}
                </strong>
              </p>
            </div>
            <p className="meta">
              Peso bruto: {data.pesoBruto ?? '—'} · Peso líquido:{' '}
              {data.pesoLiquido ?? '—'} · Produção/h: {data.producaoHr ?? '—'}
            </p>

            <h3>Operações do roteiro</h3>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Descrição</th>
                    <th>Seção</th>
                    <th>Prep.</th>
                    <th>Prod.</th>
                    <th>Peças</th>
                    <th>Eq. padr.</th>
                  </tr>
                </thead>
                <tbody>
                  {data.operacoes.map((op) => (
                    <tr key={op.id}>
                      <td>{op.numeroOperacao}</td>
                      <td>
                        {op.descricao ?? '—'}
                        {op.observacao1 ? (
                          <div className="muted">{op.observacao1}</div>
                        ) : null}
                      </td>
                      <td>{op.secaoCodigo ?? '—'}</td>
                      <td>{formatarSegundos(op.preparacaoSegundos)}</td>
                      <td>{formatarSegundos(op.producaoSegundos)}</td>
                      <td>{op.pecas ?? '—'}</td>
                      <td>{op.equipamentoEscolhido ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {(mps.length > 0 || mpsExtra.length > 0) && (
              <>
                <h3>Matérias-primas do processo</h3>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Classe</th>
                        <th>Item</th>
                        <th>Peso</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...mps, ...mpsExtra].map((m, i) => (
                        <tr key={i}>
                          <td className="mono">
                            {m.classeLetra ?? ''}
                            {m.classeNumero ?? ''}
                          </td>
                          <td className="mono">{m.itemCodigo ?? '—'}</td>
                          <td>{m.peso ?? '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            <div className="form-actions">
              <Link
                to={`/ordens-producao/novo`}
                className="btn btn-primary"
                state={{ desenho: data.produtoCodigo }}
              >
                Criar OP com este desenho
              </Link>
            </div>
          </>
        )}
      </section>
    </>
  );
}
