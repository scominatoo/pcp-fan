import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { listarUsuarios } from '../../api/usuarios';
import { PageHeader } from '../../components/PageHeader';
import { Pagination } from '../../components/Pagination';

function formatarDataHora(iso: string | null) {
  return iso ? new Date(iso).toLocaleString('pt-BR') : 'Nunca';
}

export function UsuariosPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [busca, setBusca] = useState('');

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['usuarios', page, busca],
    queryFn: () => listarUsuarios({ page, limit: 20, search: busca || undefined }),
  });

  function aplicarBusca(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    setBusca(search);
  }

  return (
    <>
      <PageHeader
        eyebrow="Administração"
        title="Usuários"
        subtitle="Quem acessa o sistema e o que cada um pode fazer."
        actions={
          <Link to="/usuarios/novo" className="btn btn-primary">
            Novo usuário
          </Link>
        }
      />

      <section className="card">
        <form className="search-form" onSubmit={aplicarBusca}>
          <input
            type="search"
            placeholder="Buscar por usuário ou nome..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button type="submit" className="btn">
            Buscar
          </button>
        </form>

        {isLoading && <p>Carregando...</p>}
        {isError && <p className="erro">{(error as Error).message}</p>}

        {data && (
          <>
            <p className="meta">
              {data.meta.total.toLocaleString('pt-BR')} usuários cadastrados
            </p>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Usuário</th>
                    <th>Nome</th>
                    <th>Acesso</th>
                    <th>Situação</th>
                    <th>Último login</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {data.data.map((u) => (
                    <tr key={u.id}>
                      <td className="mono">{u.username}</td>
                      <td>{u.nome}</td>
                      <td>
                        {u.isAdmin ? (
                          <span className="badge badge-warning">Administrador</span>
                        ) : (
                          `${u.permissoes.length} permissões`
                        )}
                      </td>
                      <td>
                        <span
                          className={`badge ${u.ativo ? 'badge-success' : 'badge-neutral'}`}
                        >
                          {u.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                        {u.trocarSenha && (
                          <>
                            {' '}
                            <span className="badge badge-warning">Troca de senha pendente</span>
                          </>
                        )}
                      </td>
                      <td>{formatarDataHora(u.ultimoLogin)}</td>
                      <td>
                        <Link to={`/usuarios/${u.id}`} className="link">
                          Editar
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
