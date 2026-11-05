import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

import { PERMISSOES_RELATORIOS } from '../auth/permissoes';

type NavItem = { to: string; label: string; end?: boolean; perm?: string[] };

const NAV_GROUPS: { label: string; items: NavItem[] }[] = [
  {
    label: 'Visão geral',
    items: [{ to: '/', label: 'Painel', end: true }],
  },
  {
    label: 'Cadastros',
    items: [
      { to: '/produtos', label: 'Produtos', perm: ['produtos.ver'] },
      { to: '/processos', label: 'Processos', perm: ['processos.ver'] },
      { to: '/materia-prima', label: 'Matéria-prima', perm: ['materia_prima.ver'] },
      { to: '/clientes', label: 'Clientes', perm: ['clientes.ver'] },
    ],
  },
  {
    label: 'Produção',
    items: [
      { to: '/ordens-producao', label: 'Ordens de produção', perm: ['ordens_producao.ver'] },
      { to: '/programacao', label: 'Programação', perm: ['programacao.ver'] },
    ],
  },
  {
    label: 'Análise',
    items: [{ to: '/relatorios', label: 'Relatórios', perm: PERMISSOES_RELATORIOS }],
  },
  {
    label: 'Administração',
    items: [{ to: '/usuarios', label: 'Usuários', perm: ['usuarios.gerenciar'] }],
  },
];

export function Layout() {
  const { user, logout, can } = useAuth();

  const grupos = NAV_GROUPS.map((g) => ({
    ...g,
    items: g.items.filter((i) => !i.perm || i.perm.some((p) => can(p))),
  })).filter((g) => g.items.length > 0);
  const navigate = useNavigate();

  function sair() {
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <NavLink to="/" className="brand-link">
            <span className="brand-mark" aria-hidden>
              F
            </span>
            <span className="brand-text">
              <strong>FANANDRI</strong>
              <small>Controle de produção</small>
            </span>
          </NavLink>
        </div>

        <nav className="sidebar-nav" aria-label="Menu principal">
          {grupos.map((group) => (
            <div key={group.label} className="nav-group">
              <span className="nav-group-label">{group.label}</span>
              {group.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end ?? false}
                  className={({ isActive }) =>
                    `nav-item${isActive ? ' nav-item--active' : ''}`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <footer className="sidebar-footer">
          <div className="sidebar-user">
            <span className="sidebar-footer-label">Logado como</span>
            <strong>{user?.nome ?? user?.username ?? '…'}</strong>
            <NavLink to="/trocar-senha" className="sidebar-link">
              Trocar senha
            </NavLink>
          </div>
          <button
            type="button"
            className="btn btn-sm btn-sidebar-logout"
            onClick={sair}
          >
            Sair
          </button>
          <span className="badge badge-env">Homologação</span>
        </footer>
      </aside>

      <div className="main-area">
        <main className="main">
          <Outlet />
        </main>
        <footer className="app-footer">
          PCP Homologação · Indústria Metalúrgica FANANDRI
        </footer>
      </div>
    </div>
  );
}
