/** Permissão de cada relatório, a partir do slug da URL (op-abertas → relatorios.op_abertas). */
export function permissaoRelatorio(slug: string) {
  return `relatorios.${slug.replace(/-/g, '_')}`;
}

export const PERMISSOES_RELATORIOS = [
  'op-abertas',
  'op-baixadas',
  'producao-setor',
  'mp-estoque-critico',
  'programacao-sintetico',
].map(permissaoRelatorio);
