import { useQuery } from '@tanstack/react-query';
import { FormEvent, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  buscarClientes,
  listarClientes,
  type ClienteSugestao,
} from '../../api/clientes';
import { PageHeader } from '../../components/PageHeader';
import { Pagination } from '../../components/Pagination';

/**
 * Listagem de clientes (PCPA04I) com autocomplete na busca.
 * Ao escolher uma sugestão, filtra a tabela e/ou abre o detalhe.
 */
export function ClientesPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [busca, setBusca] = useState('');

  // Estado do autocomplete
  const [sugestoes, setSugestoes] = useState<ClienteSugestao[]>([]);
  const [mostrando, setMostrando] = useState(false);
  const [carregandoSug, setCarregandoSug] = useState(false);
  const [indiceDestaque, setIndiceDestaque] = useState(-1);
  const boxRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['clientes', page, busca],
    queryFn: () =>
      listarClientes({ page, limit: 20, search: busca || undefined }),
  });

  useEffect(() => {
    function onClickFora(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setMostrando(false);
      }
    }
    document.addEventListener('mousedown', onClickFora);
    return () => document.removeEventListener('mousedown', onClickFora);
  }, []);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  function agendarSugestoes(termo: string) {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const limpo = termo.trim();
    if (limpo.length < 1) {
      setSugestoes([]);
      setMostrando(false);
      setCarregandoSug(false);
      return;
    }
    setCarregandoSug(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const lista = await buscarClientes(limpo, 10);
        setSugestoes(lista);
        setMostrando(true);
        setIndiceDestaque(-1);
      } catch {
        setSugestoes([]);
        setMostrando(false);
      } finally {
        setCarregandoSug(false);
      }
    }, 250);
  }

  function aplicarBusca(e: FormEvent) {
    e.preventDefault();
    setMostrando(false);
    setPage(1);
    setBusca(search.trim());
  }

  /** Escolhe sugestão → filtra a lista e vai para o detalhe. */
  function selecionar(item: ClienteSugestao) {
    setSearch(item.label);
    setBusca(item.empresa);
    setPage(1);
    setMostrando(false);
    navigate(`/clientes/${item.id}`);
  }

  return (
    <>
      <PageHeader
        eyebrow="Cadastros"
        title="Clientes"
        subtitle="Cadastro comercial migrado do legado PC1004 (PCPA04I) — 813 empresas."
      />

      <section className="card">
        <div className="toolbar">
          <h2>Listagem</h2>
        </div>

        <form className="search-form" onSubmit={aplicarBusca}>
          <div className="autocomplete" ref={boxRef}>
            <input
              type="search"
              placeholder="Digite nome, código, CNPJ ou cidade…"
              value={search}
              autoComplete="off"
              role="combobox"
              aria-expanded={mostrando}
              aria-controls="sugestoes-cliente"
              aria-autocomplete="list"
              onChange={(e) => {
                setSearch(e.target.value);
                agendarSugestoes(e.target.value);
              }}
              onFocus={() => {
                if (sugestoes.length > 0) setMostrando(true);
                else if (search.trim()) agendarSugestoes(search);
              }}
              onKeyDown={(e) => {
                if (e.key === 'ArrowDown' && mostrando) {
                  e.preventDefault();
                  setIndiceDestaque((i) =>
                    Math.min(i + 1, sugestoes.length - 1),
                  );
                  return;
                }
                if (e.key === 'ArrowUp' && mostrando) {
                  e.preventDefault();
                  setIndiceDestaque((i) => Math.max(i - 1, 0));
                  return;
                }
                if (
                  e.key === 'Enter' &&
                  mostrando &&
                  indiceDestaque >= 0 &&
                  sugestoes[indiceDestaque]
                ) {
                  e.preventDefault();
                  selecionar(sugestoes[indiceDestaque]);
                  return;
                }
                if (e.key === 'Escape') {
                  setMostrando(false);
                }
              }}
            />
            {mostrando && (
              <ul
                id="sugestoes-cliente"
                className="autocomplete-list"
                role="listbox"
              >
                {carregandoSug && (
                  <li className="autocomplete-empty">Buscando…</li>
                )}
                {!carregandoSug && sugestoes.length === 0 && (
                  <li className="autocomplete-empty">Nenhum cliente encontrado</li>
                )}
                {!carregandoSug &&
                  sugestoes.map((item, idx) => (
                    <li key={item.id} role="option">
                      <button
                        type="button"
                        className={
                          idx === indiceDestaque
                            ? 'autocomplete-item is-active'
                            : 'autocomplete-item'
                        }
                        onMouseDown={(ev) => {
                          ev.preventDefault();
                          selecionar(item);
                        }}
                      >
                        <span className="mono">{item.codigo}</span>
                        <span className="autocomplete-desc">{item.label}</span>
                        <span className="muted">
                          {[item.cidade, item.estado].filter(Boolean).join('/')}
                        </span>
                      </button>
                    </li>
                  ))}
              </ul>
            )}
          </div>
          <button type="submit" className="btn">
            Buscar
          </button>
        </form>

        {isLoading && <p>Carregando...</p>}
        {isError && (
          <p className="erro">
            {(error as Error).message ?? 'Erro ao carregar clientes'}
          </p>
        )}

        {data && (
          <>
            <p className="meta">
              {data.meta.total.toLocaleString('pt-BR')} clientes
              {busca ? ` para “${busca}”` : ' cadastrados'}
            </p>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Empresa</th>
                    <th>Cidade</th>
                    <th>UF</th>
                    <th>CNPJ/CGC</th>
                    <th>Contato</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {data.data.map((c) => (
                    <tr key={c.id}>
                      <td className="mono">{c.codigo}</td>
                      <td>
                        {c.empresa}
                        {c.sufixo ? (
                          <span className="muted"> — {c.sufixo}</span>
                        ) : null}
                      </td>
                      <td>{c.cidade ?? '—'}</td>
                      <td>{c.estado ?? '—'}</td>
                      <td className="mono">{c.cgc ?? '—'}</td>
                      <td>{c.contato1 ?? '—'}</td>
                      <td>
                        <Link to={`/clientes/${c.id}`} className="link">
                          Ver
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              page={data.meta.page}
              totalPages={data.meta.totalPages}
              onPageChange={setPage}
            />
          </>
        )}
      </section>
    </>
  );
}
