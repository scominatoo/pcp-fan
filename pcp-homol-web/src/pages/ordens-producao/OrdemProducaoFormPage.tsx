import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FormEvent, useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
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

/** Exemplo real migrado — use se quiser validar o botão rápido. */
const EXEMPLO_DESENHO = '90531014';

export function OrdemProducaoFormPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const desenhoInicial =
    (location.state as { desenho?: string } | null)?.desenho ?? '';
  // Âncora para rolar a tela até o roteiro quando a busca der certo
  const roteiroRef = useRef<HTMLDivElement>(null);

  const [codigo, setCodigo] = useState<number | ''>('');
  const [produtoCodigo, setProdutoCodigo] = useState(desenhoInicial);
  const [quantidade, setQuantidade] = useState(1);
  const [tipo, setTipo] = useState('PRD');
  const [clienteNome, setClienteNome] = useState('');
  const [preparo, setPreparo] = useState<PrepararCriacaoOp | null>(null);
  const [erroPreparo, setErroPreparo] = useState('');
  const [buscando, setBuscando] = useState(false);
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
    // Sem desenho: avisa — antes o botão “sumia” sem feedback
    if (!limpo) {
      setPreparo(null);
      setErroPreparo('Informe o desenho do cliente antes de buscar o roteiro.');
      return;
    }
    setErroPreparo('');
    setBuscando(true);
    try {
      const dados = await prepararCriacaoOp(limpo);
      setPreparo(dados);
      // Alinha o campo com a chave real do processo (pode diferir do digitado)
      setProdutoCodigo(dados.produtoCodigo);
      const defaults: Record<number, number> = {};
      for (const op of dados.operacoes) {
        defaults[op.numeroOperacao] = op.equipamentoPadraoIndice;
      }
      setIndicePorOperacao(defaults);
      // Leva o olho até a tabela de operações (o que “deveria aparecer”)
      requestAnimationFrame(() => {
        roteiroRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    } catch (e) {
      setPreparo(null);
      setErroPreparo((e as Error).message);
    } finally {
      setBuscando(false);
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
        produtoCodigo: preparo?.produtoCodigo ?? produtoCodigo.trim(),
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
        subtitle="Informe o desenho do cliente e clique em Buscar roteiro para carregar as operações."
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
                onChange={(e) => {
                  setProdutoCodigo(e.target.value);
                  // Se o usuário muda o desenho, invalida o roteiro anterior
                  if (preparo) {
                    setPreparo(null);
                    setErroPreparo('');
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    void buscarProcesso();
                  }
                }}
                placeholder={`Ex.: ${EXEMPLO_DESENHO}`}
                required
              />
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => void buscarProcesso()}
                disabled={buscando}
              >
                {buscando ? 'Buscando...' : 'Buscar roteiro'}
              </button>
            </div>
          </label>

          <p className="muted">
            Ao clicar, o sistema carrega o <strong>roteiro de operações</strong>{' '}
            (equipamentos por etapa). Códigos válidos estão em{' '}
            <Link to="/processos">Cadastros → Processos</Link>
            {' · '}teste rápido:{' '}
            <button
              type="button"
              className="link"
              onClick={() => {
                setProdutoCodigo(EXEMPLO_DESENHO);
                setPreparo(null);
                setErroPreparo('');
              }}
            >
              usar {EXEMPLO_DESENHO}
            </button>
          </p>

          {erroPreparo && (
            <div className="alert alert-error" role="alert">
              {erroPreparo}
            </div>
          )}

          {preparo && (
            <div className="alert alert-success" ref={roteiroRef}>
              <strong>Roteiro encontrado.</strong> Produto:{' '}
              {preparo.produtoDescricao} ({preparo.produtoCodigoFormatado}) —{' '}
              {preparo.operacoes.length} operações listadas abaixo. Escolha o
              equipamento de cada etapa e clique em Criar OP.
            </div>
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
              <h3>Roteiro — equipamentos por operação</h3>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Operação</th>
                      <th>Seção</th>
                      <th>Equipamento</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preparo.operacoes.map((op) => (
                      <tr key={op.numeroOperacao}>
                        <td>{op.numeroOperacao}</td>
                        <td>{op.descricao ?? '—'}</td>
                        <td>{op.secaoCodigo ?? '—'}</td>
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
