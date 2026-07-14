import { Link } from 'react-router-dom';
import { PageHeader } from '../../components/PageHeader';

const RELATORIOS = [
  {
    slug: 'op-abertas',
    titulo: 'OP em aberto',
    referencia: 'PC1078',
    descricao:
      'Ordens de produção ainda não baixadas, com filtro por período de abertura.',
  },
  {
    slug: 'op-baixadas',
    titulo: 'OP baixadas',
    referencia: 'PC1071',
    descricao:
      'OPs encerradas com dados consolidados de baixa (peças produzidas, MP).',
  },
  {
    slug: 'producao-setor',
    titulo: 'Produção por setor',
    referencia: 'PC1135',
    descricao:
      'Quantidade produzida acumulada por seção, a partir das baixas de operação.',
  },
  {
    slug: 'mp-estoque-critico',
    titulo: 'Estoque MP crítico',
    referencia: 'PC1059',
    descricao:
      'Matérias-primas abaixo do mínimo ou acima do máximo cadastrado.',
  },
  {
    slug: 'programacao-sintetico',
    titulo: 'Programação sintética',
    referencia: 'PC1067',
    descricao:
      'Totais de programação agrupados por mês (programado, entregue, a produzir).',
  },
] as const;

export function RelatoriosHubPage() {
  return (
    <>
      <PageHeader
        eyebrow="Análise"
        title="Relatórios"
        subtitle="Consultas equivalentes ao COBOL, com filtros e impressão."
      />

      <div className="report-grid">
        {RELATORIOS.map((r) => (
          <Link
            key={r.slug}
            to={`/relatorios/${r.slug}`}
            className="report-card"
          >
            <div className="report-card-head">
              <h3>{r.titulo}</h3>
              <span className="badge badge-neutral">{r.referencia}</span>
            </div>
            <p>{r.descricao}</p>
            <span className="module-link">Gerar relatório</span>
          </Link>
        ))}
      </div>
    </>
  );
}
