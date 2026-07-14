import { NavLink, Outlet } from 'react-router-dom';

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
          <span className="sidebar-footer-label">Ambiente</span>
          <span className="badge badge-env">Homologação</span>
          <p className="sidebar-note">
            Dados migrados do legado COBOL — não use em produção.
          </p>
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
