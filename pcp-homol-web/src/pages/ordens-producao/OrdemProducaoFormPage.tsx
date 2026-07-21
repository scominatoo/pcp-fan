import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FormEvent, useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  buscarClientes,
  type ClienteSugestao,
} from '../../api/clientes';
import {
  buscarDesenhosCliente,
  criarOp,
  prepararCriacaoOp,
  proximoCodigoOp,
  type DesenhoClienteSugestao,
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
  // Caixa do autocomplete de desenho (fecha ao clicar fora)
  const autocompleteRef = useRef<HTMLDivElement>(null);
  // Caixa do autocomplete de cliente
  const clienteAutoRef = useRef<HTMLDivElement>(null);
  // Timers de debounce (desenho e cliente)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const debounceClienteRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // Estado do autocomplete de desenhos
  const [sugestoes, setSugestoes] = useState<DesenhoClienteSugestao[]>([]);
  const [mostrandoSugestoes, setMostrandoSugestoes] = useState(false);
  const [carregandoSugestoes, setCarregandoSugestoes] = useState(false);
  const [indiceDestaque, setIndiceDestaque] = useState(-1);

  // Estado do autocomplete de clientes (PCPA04I)
  const [sugestoesCliente, setSugestoesCliente] = useState<ClienteSugestao[]>(
    [],
  );
  const [mostrandoCliente, setMostrandoCliente] = useState(false);
  const [carregandoCliente, setCarregandoCliente] = useState(false);
  const [indiceCliente, setIndiceCliente] = useState(-1);

  const { data: proximo } = useQuery({
    queryKey: ['op-proximo-codigo'],
    queryFn: proximoCodigoOp,
  });

  useEffect(() => {
    if (proximo && codigo === '') {
      setCodigo(proximo.codigo);
    }
  }, [proximo, codigo]);

  // Fecha a lista se o usuário clicar fora do campo
  useEffect(() => {
    function onClickFora(e: MouseEvent) {
      const alvo = e.target as Node;
      if (autocompleteRef.current && !autocompleteRef.current.contains(alvo)) {
        setMostrandoSugestoes(false);
      }
      if (clienteAutoRef.current && !clienteAutoRef.current.contains(alvo)) {
        setMostrandoCliente(false);
      }
    }
    document.addEventListener('mousedown', onClickFora);
    return () => document.removeEventListener('mousedown', onClickFora);
  }, []);

  // Limpa os timers de debounce ao desmontar a página
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (debounceClienteRef.current) clearTimeout(debounceClienteRef.current);
    };
  }, []);

  /** Consulta a API de desenhos com atraso de 250ms (debounce). */
  function agendarBuscaSugestoes(termo: string) {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const limpo = termo.trim();
    if (limpo.length < 1) {
      setSugestoes([]);
      setMostrandoSugestoes(false);
      setCarregandoSugestoes(false);
      return;
    }
    setCarregandoSugestoes(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const lista = await buscarDesenhosCliente(limpo, 12);
        setSugestoes(lista);
        setMostrandoSugestoes(true);
        setIndiceDestaque(-1);
      } catch {
        setSugestoes([]);
        setMostrandoSugestoes(false);
      } finally {
        setCarregandoSugestoes(false);
      }
    }, 250);
  }

  /** Autocomplete de clientes (cadastro PCPA04I). */
  function agendarBuscaClientes(termo: string) {
    if (debounceClienteRef.current) clearTimeout(debounceClienteRef.current);
    const limpo = termo.trim();
    if (limpo.length < 1) {
      setSugestoesCliente([]);
      setMostrandoCliente(false);
      setCarregandoCliente(false);
      return;
    }
    setCarregandoCliente(true);
    debounceClienteRef.current = setTimeout(async () => {
      try {
        const lista = await buscarClientes(limpo, 10);
        setSugestoesCliente(lista);
        setMostrandoCliente(true);
        setIndiceCliente(-1);
      } catch {
        setSugestoesCliente([]);
        setMostrandoCliente(false);
      } finally {
        setCarregandoCliente(false);
      }
    }, 250);
  }

  function selecionarCliente(item: ClienteSugestao) {
    // Grava na OP no máximo 40 caracteres (limite do legado OP-CLIENTE)
    setClienteNome(item.label.slice(0, 40));
    setMostrandoCliente(false);
    setSugestoesCliente([]);
  }

  /** Aplica um desenho escolhido na lista e já carrega o roteiro. */
  function selecionarDesenho(item: DesenhoClienteSugestao) {
    setProdutoCodigo(item.desenhoCliente);
    setSugestoes([]);
    setMostrandoSugestoes(false);
    setPreparo(null);
    setErroPreparo('');
    void buscarProcesso(item.desenhoCliente);
  }

  async function buscarProcesso(desenhoOverride?: string) {
    const limpo = (desenhoOverride ?? produtoCodigo).trim();
    // Sem desenho: avisa — antes o botão “sumia” sem feedback
    if (!limpo) {
      setPreparo(null);
      setErroPreparo('Informe o desenho do cliente antes de buscar o roteiro.');
      return null;
    }
    setErroPreparo('');
    setBuscando(true);
    setMostrandoSugestoes(false);
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
      return dados;
    } catch (e) {
      setPreparo(null);
      setErroPreparo((e as Error).message);
      return null;
    } finally {
      setBuscando(false);
    }
  }

  const salvar = useMutation({
    mutationFn: async (preparoAtual: PrepararCriacaoOp) => {
      const operacoes = preparoAtual.operacoes.map((op) => {
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
        produtoCodigo: preparoAtual.produtoCodigo,
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

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    // Se o usuário ainda não buscou o roteiro, faz isso automaticamente
    // (antes o botão ficava desabilitado e parecia “quebrado”).
    let atual = preparo;
    if (!atual) {
      atual = await buscarProcesso();
      if (!atual) return;
    }
    salvar.mutate(atual);
  }

  return (
    <>
      <PageHeader
        eyebrow="Produção"
        title="Nova ordem de produção"
        subtitle="Digite o desenho do cliente (autocomplete busca no banco) e confirme o roteiro."
        actions={
          <Link to="/ordens-producao" className="link">
            Voltar
          </Link>
        }
      />

      <section className="card">
        <form className="form" onSubmit={(e) => void onSubmit(e)}>
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
            <div className="lookup-row" ref={autocompleteRef}>
              <div className="autocomplete">
                <input
                  type="text"
                  maxLength={15}
                  value={produtoCodigo}
                  autoComplete="off"
                  role="combobox"
                  aria-expanded={mostrandoSugestoes}
                  aria-controls="sugestoes-desenho"
                  aria-autocomplete="list"
                  onChange={(e) => {
                    const valor = e.target.value;
                    setProdutoCodigo(valor);
                    // Se o usuário muda o desenho, invalida o roteiro anterior
                    if (preparo) {
                      setPreparo(null);
                      setErroPreparo('');
                    }
                    agendarBuscaSugestoes(valor);
                  }}
                  onFocus={() => {
                    if (sugestoes.length > 0) setMostrandoSugestoes(true);
                    else if (produtoCodigo.trim()) {
                      agendarBuscaSugestoes(produtoCodigo);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'ArrowDown' && mostrandoSugestoes) {
                      e.preventDefault();
                      setIndiceDestaque((i) =>
                        Math.min(i + 1, sugestoes.length - 1),
                      );
                      return;
                    }
                    if (e.key === 'ArrowUp' && mostrandoSugestoes) {
                      e.preventDefault();
                      setIndiceDestaque((i) => Math.max(i - 1, 0));
                      return;
                    }
                    if (
                      e.key === 'Enter' &&
                      mostrandoSugestoes &&
                      indiceDestaque >= 0 &&
                      sugestoes[indiceDestaque]
                    ) {
                      e.preventDefault();
                      selecionarDesenho(sugestoes[indiceDestaque]);
                      return;
                    }
                    if (e.key === 'Escape') {
                      setMostrandoSugestoes(false);
                      return;
                    }
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      setMostrandoSugestoes(false);
                      void buscarProcesso();
                    }
                  }}
                  placeholder={`Ex.: ${EXEMPLO_DESENHO} ou digite 0828…`}
                  required
                />
                {mostrandoSugestoes && (
                  <ul
                    id="sugestoes-desenho"
                    className="autocomplete-list"
                    role="listbox"
                  >
                    {carregandoSugestoes && (
                      <li className="autocomplete-empty">Buscando…</li>
                    )}
                    {!carregandoSugestoes && sugestoes.length === 0 && (
                      <li className="autocomplete-empty">
                        Nenhum desenho encontrado
                      </li>
                    )}
                    {!carregandoSugestoes &&
                      sugestoes.map((item, idx) => (
                        <li key={item.desenhoCliente} role="option">
                          <button
                            type="button"
                            className={
                              idx === indiceDestaque
                                ? 'autocomplete-item is-active'
                                : 'autocomplete-item'
                            }
                            onMouseDown={(e) => {
                              // mousedown (não click) evita perder o foco antes de selecionar
                              e.preventDefault();
                              selecionarDesenho(item);
                            }}
                          >
                            <span className="mono">{item.desenhoCliente}</span>
                            <span className="autocomplete-desc">
                              {item.descricao ?? '—'}
                            </span>
                            <span
                              className={
                                item.temRoteiro
                                  ? 'badge badge-success'
                                  : 'badge badge-warning'
                              }
                            >
                              {item.temRoteiro ? 'com roteiro' : 'sem roteiro'}
                            </span>
                          </button>
                        </li>
                      ))}
                  </ul>
                )}
              </div>
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
            Digite para buscar em <strong>DesenhoCliente</strong> (legado{' '}
            PCPA106I — {`~2.700`} códigos). Ao escolher ou clicar em Buscar
            roteiro, o sistema carrega as operações.{' '}
            <Link to="/processos">Cadastros → Processos</Link>
            {' · '}teste rápido:{' '}
            <button
              type="button"
              className="link"
              onClick={() => {
                setProdutoCodigo(EXEMPLO_DESENHO);
                setPreparo(null);
                setErroPreparo('');
                void buscarProcesso(EXEMPLO_DESENHO);
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
              <div className="autocomplete" ref={clienteAutoRef}>
                <input
                  type="text"
                  maxLength={40}
                  value={clienteNome}
                  autoComplete="off"
                  role="combobox"
                  aria-expanded={mostrandoCliente}
                  aria-controls="sugestoes-cliente-op"
                  aria-autocomplete="list"
                  placeholder="Digite para buscar no cadastro (813 clientes)…"
                  onChange={(e) => {
                    setClienteNome(e.target.value);
                    agendarBuscaClientes(e.target.value);
                  }}
                  onFocus={() => {
                    if (sugestoesCliente.length > 0) setMostrandoCliente(true);
                    else if (clienteNome.trim()) {
                      agendarBuscaClientes(clienteNome);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'ArrowDown' && mostrandoCliente) {
                      e.preventDefault();
                      setIndiceCliente((i) =>
                        Math.min(i + 1, sugestoesCliente.length - 1),
                      );
                      return;
                    }
                    if (e.key === 'ArrowUp' && mostrandoCliente) {
                      e.preventDefault();
                      setIndiceCliente((i) => Math.max(i - 1, 0));
                      return;
                    }
                    if (
                      e.key === 'Enter' &&
                      mostrandoCliente &&
                      indiceCliente >= 0 &&
                      sugestoesCliente[indiceCliente]
                    ) {
                      e.preventDefault();
                      selecionarCliente(sugestoesCliente[indiceCliente]);
                      return;
                    }
                    if (e.key === 'Escape') {
                      setMostrandoCliente(false);
                    }
                  }}
                />
                {mostrandoCliente && (
                  <ul
                    id="sugestoes-cliente-op"
                    className="autocomplete-list"
                    role="listbox"
                  >
                    {carregandoCliente && (
                      <li className="autocomplete-empty">Buscando…</li>
                    )}
                    {!carregandoCliente && sugestoesCliente.length === 0 && (
                      <li className="autocomplete-empty">
                        Nenhum cliente — você ainda pode digitar o nome livre
                      </li>
                    )}
                    {!carregandoCliente &&
                      sugestoesCliente.map((item, idx) => (
                        <li key={item.id} role="option">
                          <button
                            type="button"
                            className={
                              idx === indiceCliente
                                ? 'autocomplete-item is-active'
                                : 'autocomplete-item'
                            }
                            onMouseDown={(ev) => {
                              ev.preventDefault();
                              selecionarCliente(item);
                            }}
                          >
                            <span className="mono">{item.codigo}</span>
                            <span className="autocomplete-desc">
                              {item.label}
                            </span>
                            <span className="muted">
                              {[item.cidade, item.estado]
                                .filter(Boolean)
                                .join('/')}
                            </span>
                          </button>
                        </li>
                      ))}
                  </ul>
                )}
              </div>
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
              disabled={salvar.isPending || buscando || !produtoCodigo.trim()}
            >
              {salvar.isPending
                ? 'Gravando...'
                : buscando
                  ? 'Preparando...'
                  : 'Criar OP'}
            </button>
            {!preparo && produtoCodigo.trim() && (
              <span className="muted">
                Se ainda não buscou o roteiro, o sistema fará isso ao criar.
              </span>
            )}
          </div>
        </form>
      </section>
    </>
  );
}
