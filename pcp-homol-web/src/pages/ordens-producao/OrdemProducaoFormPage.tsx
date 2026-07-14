import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  criarOp,
  prepararCriacaoOp,
  proximoCodigoOp,
  type PrepararCriacaoOp,
} from '../../api/ordens-producao';
import { PageHeader } from '../../components/PageHeader';

const TIPOS = [
  { value: 'PRD', label: 'PRD — Produção' },
  { value: 'PRO', label: 'PRO — Protótipo' },
  { value: 'PIL', label: 'PIL — Piloto' },
  { value: 'TRY', label: 'TRY — Try-out' },
];

export function OrdemProducaoFormPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [codigo, setCodigo] = useState<number | ''>('');
  const [produtoCodigo, setProdutoCodigo] = useState('');
  const [quantidade, setQuantidade] = useState(1);
  const [tipo, setTipo] = useState('PRD');
  const [clienteNome, setClienteNome] = useState('');
  const [preparo, setPreparo] = useState<PrepararCriacaoOp | null>(null);
  const [erroPreparo, setErroPreparo] = useState('');
  const [indicePorOperacao, setIndicePorOperacao] = useState<
    Record<number, number>
  >({});

  const { data: proximo } = useQuery({
    queryKey: ['op-proximo-codigo'],
    queryFn: proximoCodigoOp,
  });

  useEffect(() => {
    if (proximo && codigo === '') {
      setCodigo(proximo.codigo);
    }
  }, [proximo, codigo]);

  async function buscarProcesso() {
    const limpo = produtoCodigo.trim();
    if (!limpo) {
      setPreparo(null);
      setErroPreparo('');
      return;
    }
    setErroPreparo('');
    try {
      const dados = await prepararCriacaoOp(limpo);
      setPreparo(dados);
      const defaults: Record<number, number> = {};
      for (const op of dados.operacoes) {
        defaults[op.numeroOperacao] = op.equipamentoPadraoIndice;
      }
      setIndicePorOperacao(defaults);
    } catch (e) {
      setPreparo(null);
      setErroPreparo((e as Error).message);
    }
  }

  const salvar = useMutation({
    mutationFn: () => {
      const operacoes = preparo?.operacoes.map((op) => {
        const indice = indicePorOperacao[op.numeroOperacao] ?? 0;
        const alt = op.alternativas.find((a) => a.indice === indice);
        return {
          numeroOperacao: op.numeroOperacao,
          indice: indice > 0 ? indice : undefined,
          equipamentoGrupo: alt?.equipamentoGrupo,
          equipamentoCodigo: alt?.equipamentoCodigo,
        };
      });

      return criarOp({
        codigo: typeof codigo === 'number' ? codigo : undefined,
        produtoCodigo: produtoCodigo.trim(),
        quantidade,
        tipo,
        clienteNome: clienteNome.trim() || undefined,
        operacoes,
      });
    },
    onSuccess: (op) => {
      queryClient.invalidateQueries({ queryKey: ['ops'] });
      navigate(`/ordens-producao/${op.id}`);
    },
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!preparo) {
      setErroPreparo('Busque o desenho e confirme que o processo existe');
      return;
    }
    salvar.mutate();
  }

  return (
    <>
      <PageHeader
        eyebrow="Produção"
        title="Nova ordem de produção"
        subtitle="Informe o desenho do cliente para carregar o roteiro automático."
        actions={
          <Link to="/ordens-producao" className="link">
            Voltar
          </Link>
        }
      />

      <section className="card">
      <form className="form" onSubmit={onSubmit}>
        <div className="form-row">
          <label>
            Código OP
            <input
              type="number"
              min={1}
              value={codigo}
              onChange={(e) =>
                setCodigo(e.target.value ? Number(e.target.value) : '')
              }
              required
            />
          </label>
          <label>
            Tipo *
            <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
              {TIPOS.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label>
          Desenho do cliente *
          <div className="lookup-row">
            <input
              type="text"
              maxLength={15}
              value={produtoCodigo}
              onChange={(e) => setProdutoCodigo(e.target.value)}
              onBlur={buscarProcesso}
              placeholder="Ex.: 90531014"
              required
            />
            <button type="button" className="btn" onClick={buscarProcesso}>
              Buscar roteiro
            </button>
          </div>
        </label>

        {erroPreparo && <p className="erro">{erroPreparo}</p>}

        {preparo && (
          <p className="meta">
            Produto: <strong>{preparo.produtoDescricao}</strong> (
            {preparo.produtoCodigoFormatado}) — {preparo.operacoes.length}{' '}
            operações no roteiro
          </p>
        )}

        <div className="form-row">
          <label>
            Quantidade *
            <input
              type="number"
              min={1}
              max={9999999}
              value={quantidade}
              onChange={(e) => setQuantidade(Number(e.target.value))}
              required
            />
          </label>
          <label>
            Cliente
            <input
              type="text"
              maxLength={40}
              value={clienteNome}
              onChange={(e) => setClienteNome(e.target.value)}
            />
          </label>
        </div>

        {preparo && preparo.operacoes.length > 0 && (
          <>
            <h3>Equipamentos por operação</h3>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Operação</th>
                    <th>Equipamento</th>
                  </tr>
                </thead>
                <tbody>
                  {preparo.operacoes.map((op) => (
                    <tr key={op.numeroOperacao}>
                      <td>{op.numeroOperacao}</td>
                      <td>{op.descricao ?? '—'}</td>
                      <td>
                        {op.alternativas.length > 0 ? (
                          <select
                            value={
                              indicePorOperacao[op.numeroOperacao] ?? 0
                            }
                            onChange={(e) =>
                              setIndicePorOperacao((prev) => ({
                                ...prev,
                                [op.numeroOperacao]: Number(e.target.value),
                              }))
                            }
                          >
                            <option value={0}>— Nenhum —</option>
                            {op.alternativas.map((alt) => (
                              <option key={alt.indice} value={alt.indice}>
                                {alt.label}
                              </option>
                            ))}
                          </select>
                        ) : (
                          '—'
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {salvar.isError && (
          <p className="erro">{(salvar.error as Error).message}</p>
        )}

        <div className="form-actions">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={salvar.isPending || !preparo}
          >
            {salvar.isPending ? 'Gravando...' : 'Criar OP'}
          </button>
        </div>
      </form>
    </section>
    </>
  );
}
