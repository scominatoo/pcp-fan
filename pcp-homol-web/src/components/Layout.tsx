import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

const NAV_GROUPS = [
  {
    label: 'Visão geral',
    items: [{ to: '/', label: 'Painel', end: true }],
  },
  {
    label: 'Cadastros',
    items: [
      { to: '/produtos', label: 'Produtos' },
      { to: '/materia-prima', label: 'Matéria-prima' },
    ],
  },
  {
    label: 'Produção',
    items: [
      { to: '/ordens-producao', label: 'Ordens de produção' },
      { to: '/programacao', label: 'Programação' },
    ],
  },
  {
    label: 'Análise',
    items: [{ to: '/relatorios', label: 'Relatórios' }],
  },
] as const;

export function Layout() {
  const { user, logout } = useAuth();
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
          {NAV_GROUPS.map((group) => (
            <div key={group.label} className="nav-group">
              <span className="nav-group-label">{group.label}</span>
              {group.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={'end' in item ? item.end : false}
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
            <strong>{user?.username ?? 'admin'}</strong>
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
