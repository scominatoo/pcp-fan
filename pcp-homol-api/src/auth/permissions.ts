/**
 * Catálogo de permissões do sistema (fonte única).
 * O front busca esta lista em GET /api/usuarios/permissoes-catalogo
 * para montar a matriz de permissões.
 */

export type AcaoPermissao = {
  /** Chave gravada no usuário, ex.: "produtos.editar" */
  chave: string;
  rotulo: string;
  /** Ações CRUD aparecem como colunas; as demais como linhas extras. */
  tipo: 'crud' | 'especial';
};

export type ModuloPermissao = {
  modulo: string;
  rotulo: string;
  grupo: string;
  acoes: AcaoPermissao[];
};

const CRUD_ROTULOS = {
  ver: 'Ver',
  criar: 'Criar',
  editar: 'Editar',
  excluir: 'Excluir',
} as const;

function crud(
  modulo: string,
  acoes: (keyof typeof CRUD_ROTULOS)[] = ['ver', 'criar', 'editar', 'excluir'],
): AcaoPermissao[] {
  return acoes.map((a) => ({
    chave: `${modulo}.${a}`,
    rotulo: CRUD_ROTULOS[a],
    tipo: 'crud',
  }));
}

function especial(modulo: string, acao: string, rotulo: string): AcaoPermissao {
  return { chave: `${modulo}.${acao}`, rotulo, tipo: 'especial' };
}

export const CATALOGO_PERMISSOES: ModuloPermissao[] = [
  { modulo: 'produtos', rotulo: 'Produtos', grupo: 'Cadastros', acoes: crud('produtos') },
  { modulo: 'processos', rotulo: 'Processos', grupo: 'Cadastros', acoes: crud('processos', ['ver']) },
  {
    modulo: 'materia_prima',
    rotulo: 'Matéria-prima',
    grupo: 'Cadastros',
    acoes: crud('materia_prima'),
  },
  { modulo: 'clientes', rotulo: 'Clientes', grupo: 'Cadastros', acoes: crud('clientes', ['ver']) },
  {
    modulo: 'equipamentos',
    rotulo: 'Equipamentos',
    grupo: 'Cadastros',
    acoes: crud('equipamentos'),
  },
  { modulo: 'secoes', rotulo: 'Seções', grupo: 'Cadastros', acoes: crud('secoes') },
  {
    modulo: 'ordens_producao',
    rotulo: 'Ordens de produção',
    grupo: 'Produção',
    acoes: [
      ...crud('ordens_producao'),
      especial('ordens_producao', 'baixar_operacao', 'Baixar operação'),
      especial('ordens_producao', 'baixar_mp', 'Baixar matéria-prima'),
      especial('ordens_producao', 'encerrar', 'Encerrar OP'),
      especial('ordens_producao', 'imprimir', 'Imprimir / emitir OP'),
    ],
  },
  {
    modulo: 'programacao',
    rotulo: 'Programação',
    grupo: 'Produção',
    acoes: [
      ...crud('programacao'),
      especial('programacao', 'registrar_entrega', 'Registrar entrega'),
    ],
  },
  {
    modulo: 'relatorios',
    rotulo: 'Relatórios',
    grupo: 'Análise',
    acoes: [
      especial('relatorios', 'op_abertas', 'OPs abertas'),
      especial('relatorios', 'op_baixadas', 'OPs baixadas'),
      especial('relatorios', 'producao_setor', 'Produção por setor'),
      especial('relatorios', 'mp_estoque_critico', 'MP em estoque crítico'),
      especial('relatorios', 'programacao_sintetico', 'Programação sintético'),
    ],
  },
  {
    modulo: 'usuarios',
    rotulo: 'Usuários',
    grupo: 'Administração',
    acoes: [especial('usuarios', 'gerenciar', 'Gerenciar usuários e permissões')],
  },
];

export const TODAS_PERMISSOES: string[] = CATALOGO_PERMISSOES.flatMap((m) =>
  m.acoes.map((a) => a.chave),
);

export const PERMISSAO_GERENCIAR_USUARIOS = 'usuarios.gerenciar';
