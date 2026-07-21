import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { fetchHealth } from '../api/health';
import { PageHeader } from '../components/PageHeader';

const MODULOS = [
  {
    to: '/ordens-producao',
    titulo: 'Ordens de produção',
    descricao: 'Abrir, emitir, baixar e encerrar OPs.',
    stat: '72.000',
    unit: 'OPs migradas',
  },
  {
    to: '/programacao',
    titulo: 'Programação',
    descricao: 'Entregas planejadas, saldos e atrasos.',
    stat: '1.383',
    unit: 'registros',
  },
  {
    to: '/produtos',
    titulo: 'Produtos',
    descricao: 'Peças acabadas e códigos internos.',
    stat: '1.834',
    unit: 'itens',
  },
  {
    to: '/processos',
    titulo: 'Processos',
    descricao: 'Roteiros PC1070 — operações e MPs por desenho.',
    stat: '2.457',
    unit: 'processos',
  },
  {
    to: '/materia-prima',
    titulo: 'Matéria-prima',
    descricao: 'Saldo, mínimo e máximo de estoque.',
    stat: '3.298',
    unit: 'itens',
  },
  {
    to: '/clientes',
    titulo: 'Clientes',
    descricao: 'Empresas do legado PC1004 — busca com autocomplete.',
    stat: '813',
    unit: 'clientes',
  },
  {
    to: '/relatorios',
    titulo: 'Relatórios',
    descricao: 'OP aberta, setor, MP crítico e sintéticos.',
    stat: '5',
    unit: 'consultas',
  },
] as const;

export function HomePage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['health'],
    queryFn: fetchHealth,
    refetchInterval: 30_000,
  });

  const online = !isError && data?.status === 'ok' && data.database === 'ok';

  return (
    <>
      <section className="hero">
        <PageHeader
          eyebrow="Planejamento e controle da produção"
          title="Chão de fábrica, em tempo real."
          subtitle="Homologação do módulo PCP com dados reais migrados do sistema legado — pronto para validação lado a lado com o COBOL."
        />
        <div className="hero-meta">
          <div className="hero-stat">
            <span className="hero-stat-value">72.000</span>
            <span className="hero-stat-label">ordens de produção no banco</span>
          </div>
          <div className="hero-status">
            <span className="hero-status-label">Sistema</span>
            {isLoading ? (
              <span className="badge badge-neutral">Verificando…</span>
            ) : (
              <span
                className={`badge ${online ? 'badge-success' : 'badge-danger'}`}
              >
                {online ? 'Pronto para uso' : 'Indisponível'}
              </span>
            )}
          </div>
        </div>
      </section>

      {isError && (
        <div className="alert alert-error">
          API ou banco offline. Inicie o Docker, a API (porta 3000) e o frontend
          (porta 5175) conforme o manual do usuário.
        </div>
      )}

      {data && online && (
        <p className="meta meta-inline">
          Última verificação:{' '}
          {new Date(data.timestamp).toLocaleString('pt-BR')}
        </p>
      )}

      <section className="card">
        <div className="card-header">
          <h2>Onde começar</h2>
          <p className="card-lead">
            Escolha o módulo conforme a operação do dia.
          </p>
        </div>
        <div className="module-grid">
          {MODULOS.map((m) => (
            <Link key={m.to} to={m.to} className="module-card">
              <div className="module-card-stat">
                <span className="module-card-number">{m.stat}</span>
                <span className="module-card-unit">{m.unit}</span>
              </div>
              <h3>{m.titulo}</h3>
              <p>{m.descricao}</p>
              <span className="module-link">Abrir módulo</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="card card--flat">
        <h2>Sequência de uma OP</h2>
        <ol className="flow-steps">
          <li>Consultar programação do período</li>
          <li>Criar ou localizar a ordem de produção</li>
          <li>Emitir documento para a fábrica</li>
          <li>Registrar baixas de operação e matéria-prima</li>
          <li>Encerrar a OP e registrar entrega</li>
        </ol>
      </section>
    </>
  );
}
