import type { ModuloPermissao } from '../../api/usuarios';

const COLUNAS_CRUD = ['ver', 'criar', 'editar', 'excluir'] as const;
const ROTULO_COLUNA = { ver: 'Ver', criar: 'Criar', editar: 'Editar', excluir: 'Excluir' };

type Props = {
  catalogo: ModuloPermissao[];
  value: string[];
  onChange: (permissoes: string[]) => void;
  disabled?: boolean;
};

/** Chave "ver" do módulo, se existir — marcada junto com qualquer outra ação. */
function chaveVer(m: ModuloPermissao) {
  return m.acoes.find((a) => a.chave === `${m.modulo}.ver`)?.chave;
}

export function PermissoesMatrix({ catalogo, value, onChange, disabled }: Props) {
  const marcadas = new Set(value);

  function alternar(m: ModuloPermissao, chave: string, marcar: boolean) {
    const novo = new Set(marcadas);
    const ver = chaveVer(m);
    if (marcar) {
      novo.add(chave);
      if (ver) novo.add(ver);
    } else {
      novo.delete(chave);
      // Sem "Ver", as demais ações do módulo não fazem sentido.
      if (chave === ver) m.acoes.forEach((a) => novo.delete(a.chave));
    }
    onChange([...novo]);
  }

  function alternarModulo(m: ModuloPermissao, marcar: boolean) {
    const novo = new Set(marcadas);
    m.acoes.forEach((a) => (marcar ? novo.add(a.chave) : novo.delete(a.chave)));
    onChange([...novo]);
  }

  function alternarTudo(marcar: boolean) {
    onChange(marcar ? catalogo.flatMap((m) => m.acoes.map((a) => a.chave)) : []);
  }

  const grupos = [...new Set(catalogo.map((m) => m.grupo))];

  return (
    <div className="perm-matrix">
      <div className="perm-matrix-toolbar">
        <button
          type="button"
          className="btn btn-sm"
          disabled={disabled}
          onClick={() => alternarTudo(true)}
        >
          Marcar tudo
        </button>
        <button
          type="button"
          className="btn btn-sm"
          disabled={disabled}
          onClick={() => alternarTudo(false)}
        >
          Desmarcar tudo
        </button>
        <span className="meta meta-inline">{value.length} permissões marcadas</span>
      </div>

      <div className="table-wrap">
        <table className="perm-table">
          <thead>
            <tr>
              <th>Módulo</th>
              {COLUNAS_CRUD.map((c) => (
                <th key={c} className="perm-col">
                  {ROTULO_COLUNA[c]}
                </th>
              ))}
              <th className="perm-col">Tudo</th>
            </tr>
          </thead>
          {grupos.map((grupo) => (
            <tbody key={grupo}>
              <tr className="perm-grupo">
                <td colSpan={6}>{grupo}</td>
              </tr>
              {catalogo
                .filter((m) => m.grupo === grupo)
                .flatMap((m) => {
                  const especiais = m.acoes.filter((a) => a.tipo === 'especial');
                  const temCrud = m.acoes.some((a) => a.tipo === 'crud');
                  const todasMarcadas = m.acoes.every((a) => marcadas.has(a.chave));
                  const linhas = [
                    <tr key={m.modulo}>
                      <th scope="row" className="perm-modulo">
                        {m.rotulo}
                      </th>
                      {COLUNAS_CRUD.map((c) => {
                        const chave = `${m.modulo}.${c}`;
                        const existe = m.acoes.some((a) => a.chave === chave);
                        return (
                          <td key={c} className="perm-col">
                            {existe ? (
                              <input
                                type="checkbox"
                                aria-label={`${m.rotulo}: ${ROTULO_COLUNA[c]}`}
                                checked={marcadas.has(chave)}
                                disabled={disabled}
                                onChange={(e) => alternar(m, chave, e.target.checked)}
                              />
                            ) : (
                              <span className="muted" aria-hidden>
                                {temCrud ? '—' : ''}
                              </span>
                            )}
                          </td>
                        );
                      })}
                      <td className="perm-col">
                        <input
                          type="checkbox"
                          aria-label={`${m.rotulo}: todas as ações`}
                          checked={todasMarcadas}
                          disabled={disabled}
                          onChange={(e) => alternarModulo(m, e.target.checked)}
                        />
                      </td>
                    </tr>,
                  ];
                  especiais.forEach((a) =>
                    linhas.push(
                      <tr key={a.chave} className="perm-especial">
                        <td colSpan={5}>
                          <label className="checkbox-inline">
                            <input
                              type="checkbox"
                              checked={marcadas.has(a.chave)}
                              disabled={disabled}
                              onChange={(e) => alternar(m, a.chave, e.target.checked)}
                            />
                            {a.rotulo}
                          </label>
                        </td>
                        <td />
                      </tr>,
                    ),
                  );
                  return linhas;
                })}
            </tbody>
          ))}
        </table>
      </div>
    </div>
  );
}
