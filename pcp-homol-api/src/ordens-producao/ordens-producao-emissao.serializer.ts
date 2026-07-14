const TIPO_LABEL: Record<string, string> = {
  PRO: 'PROTÓTIPO',
  PIL: 'PILOTO',
  TRY: 'TRY-OUT',
  PRD: 'PRODUÇÃO',
};

type EquipamentoTab = {
  equipamentoGrupo: number;
  equipamentoCodigo: number;
  ferramentaFabrica?: string | null;
  ferramentaNumero?: string | null;
  ferramentaMatricula?: number | null;
};

export function labelTipoOp(tipo: string | null): string {
  if (!tipo) return '—';
  return TIPO_LABEL[tipo] ?? tipo;
}

export function formatarEquipamento(
  grupo: number | null,
  codigo: number | null,
  descricao?: string | null,
): string {
  if (grupo == null || codigo == null || (grupo === 0 && codigo === 0)) {
    return '—';
  }
  const cod = `${String(grupo).padStart(2, '0')}.${String(codigo).padStart(4, '0')}`;
  return descricao ? `${cod} — ${descricao}` : cod;
}

export function formatarSegundos(seg: number | null): string {
  if (seg == null || seg <= 0) return '—';
  const h = Math.floor(seg / 3600);
  const m = Math.floor((seg % 3600) / 60);
  const s = seg % 60;
  if (h > 0) return `${h}h ${m}min`;
  if (m > 0) return `${m}min ${s}s`;
  return `${s}s`;
}

export type EmissaoOperacao = {
  numeroOperacao: number;
  descricao: string | null;
  observacao1: string | null;
  observacao2: string | null;
  plano: string | null;
  secaoCodigo: number | null;
  secaoDescricao: string | null;
  preparacao: string;
  producao: string;
  equipamento: string;
  ferramenta: string | null;
  dataEncerramento: Date | null;
};

export { EquipamentoTab };
