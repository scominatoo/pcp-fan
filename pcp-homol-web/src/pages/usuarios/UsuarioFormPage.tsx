import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  atualizarUsuario,
  criarUsuario,
  listarOpcoesUsuarios,
  obterCatalogoPermissoes,
  obterUsuario,
  redefinirSenhaUsuario,
} from '../../api/usuarios';
import { useAuth } from '../../auth/AuthContext';
import { PageHeader } from '../../components/PageHeader';
import { LoadingState } from '../../components/StateMessage';
import { PermissoesMatrix } from './PermissoesMatrix';

const SENHA_MIN = 8;

export function UsuarioFormPage() {
  const { id } = useParams();
  const isNovo = id === 'novo';
  const usuarioId = isNovo ? null : Number(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user: logado } = useAuth();
  const ehVoceMesmo = logado?.id === usuarioId;

  const [username, setUsername] = useState('');
  const [nome, setNome] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmacao, setConfirmacao] = useState('');
  const [exigirTroca, setExigirTroca] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [ativo, setAtivo] = useState(true);
  const [permissoes, setPermissoes] = useState<string[]>([]);
  const [erroLocal, setErroLocal] = useState<string | null>(null);

  const { data: usuario, isLoading } = useQuery({
    queryKey: ['usuario', usuarioId],
    queryFn: () => obterUsuario(usuarioId!),
    enabled: usuarioId != null && !Number.isNaN(usuarioId),
  });

  const { data: catalogo } = useQuery({
    queryKey: ['permissoes-catalogo'],
    queryFn: obterCatalogoPermissoes,
    staleTime: Infinity,
  });

  const { data: opcoes } = useQuery({
    queryKey: ['usuarios-opcoes'],
    queryFn: listarOpcoesUsuarios,
  });

  useEffect(() => {
    if (usuario) {
      setUsername(usuario.username);
      setNome(usuario.nome);
      setIsAdmin(usuario.isAdmin);
      setAtivo(usuario.ativo);
      setPermissoes(usuario.permissoes);
    }
  }, [usuario]);

  const salvar = useMutation({
    mutationFn: () =>
      isNovo
        ? criarUsuario({ username, nome, senha, exigirTroca, isAdmin, permissoes })
        : atualizarUsuario(usuarioId!, { nome, ativo, isAdmin, permissoes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
      queryClient.invalidateQueries({ queryKey: ['usuarios-opcoes'] });
      queryClient.invalidateQueries({ queryKey: ['usuario', usuarioId] });
      navigate('/usuarios');
    },
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErroLocal(null);
    if (isNovo && senha !== confirmacao) {
      setErroLocal('A confirmação não confere com a senha.');
      return;
    }
    salvar.mutate();
  }

  function copiarDe(idOrigem: string) {
    const origem = opcoes?.find((o) => o.id === Number(idOrigem));
    if (!origem) return;
    setIsAdmin(origem.isAdmin);
    setPermissoes(origem.permissoes);
  }

  if (!isNovo && isLoading) return <LoadingState />;

  return (
    <>
      <PageHeader
        eyebrow="Administração"
        title={isNovo ? 'Novo usuário' : `Usuário ${usuario?.username ?? ''}`}
        actions={
          <Link to="/usuarios" className="link">
            Voltar
          </Link>
        }
      />

      <form className="user-form" onSubmit={onSubmit}>
        <section className="card">
          <h2>Dados de acesso</h2>
          <div className="user-fields">
            <label>
              Usuário (login)
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={!isNovo}
                autoComplete="off"
                required
                pattern="[a-zA-Z0-9._\-]{3,40}"
                title="3 a 40 caracteres: letras, números, ponto, hífen ou _"
              />
            </label>
            <label>
              Nome
              <input
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                maxLength={80}
                required
              />
            </label>
            {isNovo && (
              <>
                <label>
                  Senha
                  <input
                    type="password"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    minLength={SENHA_MIN}
                    autoComplete="new-password"
                    required
                  />
                </label>
                <label>
                  Confirmar senha
                  <input
                    type="password"
                    value={confirmacao}
                    onChange={(e) => setConfirmacao(e.target.value)}
                    minLength={SENHA_MIN}
                    autoComplete="new-password"
                    required
                  />
                </label>
              </>
            )}
          </div>

          <div className="user-options">
            {isNovo && (
              <label className="checkbox-inline">
                <input
                  type="checkbox"
                  checked={exigirTroca}
                  onChange={(e) => setExigirTroca(e.target.checked)}
                />
                Exigir troca de senha no primeiro login
              </label>
            )}
            {!isNovo && (
              <label className="checkbox-inline">
                <input
                  type="checkbox"
                  checked={ativo}
                  disabled={ehVoceMesmo}
                  onChange={(e) => setAtivo(e.target.checked)}
                />
                Usuário ativo (pode entrar no sistema)
              </label>
            )}
            <label className="checkbox-inline">
              <input
                type="checkbox"
                checked={isAdmin}
                disabled={ehVoceMesmo || !logado?.isAdmin}
                onChange={(e) => setIsAdmin(e.target.checked)}
              />
              Administrador (acesso total, ignora a lista de permissões)
            </label>
            {ehVoceMesmo && (
              <p className="meta">
                Você não pode desativar nem tirar o acesso de administrador do
                próprio usuário.
              </p>
            )}
          </div>
        </section>

        <section className="card">
          <div className="toolbar">
            <div>
              <h2>Permissões</h2>
              <p className="card-lead">
                {isAdmin
                  ? 'Administradores têm acesso a tudo; a lista abaixo não se aplica.'
                  : 'Marcar Criar, Editar, Excluir ou uma ação especial marca Ver automaticamente.'}
              </p>
            </div>
            <label className="copy-from">
              Copiar permissões de
              <select
                value=""
                disabled={isAdmin}
                onChange={(e) => copiarDe(e.target.value)}
              >
                <option value="">Selecione…</option>
                {opcoes
                  ?.filter((o) => o.id !== usuarioId)
                  .map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.username} — {o.nome}
                    </option>
                  ))}
              </select>
            </label>
          </div>
          {catalogo ? (
            <PermissoesMatrix
              catalogo={catalogo}
              value={permissoes}
              onChange={setPermissoes}
              disabled={isAdmin}
            />
          ) : (
            <LoadingState message="Carregando permissões…" />
          )}
        </section>

        {(erroLocal || salvar.isError) && (
          <p className="erro">{erroLocal ?? (salvar.error as Error).message}</p>
        )}
        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={salvar.isPending}>
            {salvar.isPending ? 'Salvando...' : 'Salvar'}
          </button>
          <Link to="/usuarios" className="btn">
            Cancelar
          </Link>
        </div>
      </form>

      {!isNovo && usuarioId != null && (
        <RedefinirSenha
          usuarioId={usuarioId}
          trocaPendente={usuario?.trocarSenha ?? false}
        />
      )}
    </>
  );
}

function RedefinirSenha({
  usuarioId,
  trocaPendente,
}: {
  usuarioId: number;
  trocaPendente: boolean;
}) {
  const queryClient = useQueryClient();
  const [senha, setSenha] = useState('');
  const [exigirTroca, setExigirTroca] = useState(true);
  const redefinir = useMutation({
    mutationFn: () => redefinirSenhaUsuario(usuarioId, senha, exigirTroca),
    onSuccess: () => {
      setSenha('');
      queryClient.invalidateQueries({ queryKey: ['usuario', usuarioId] });
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
    },
  });

  return (
    <section className="card">
      <h2>Redefinir senha</h2>
      {trocaPendente && (
        <p className="card-lead">
          <span className="badge badge-warning">Troca pendente</span> Este usuário
          ainda não trocou a senha que foi redefinida.
        </p>
      )}
      <form
        className="user-reset"
        onSubmit={(e) => {
          e.preventDefault();
          redefinir.mutate();
        }}
      >
        <div className="user-fields">
          <label>
            Nova senha
            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              minLength={SENHA_MIN}
              autoComplete="new-password"
              required
            />
          </label>
        </div>
        <div className="user-options">
          <label className="checkbox-inline">
            <input
              type="checkbox"
              checked={exigirTroca}
              onChange={(e) => setExigirTroca(e.target.checked)}
            />
            Obrigar o usuário a trocar no próximo login
          </label>
          <p className="meta">
            {exigirTroca
              ? 'A senha acima vale só para o próximo login; o usuário terá de criar uma nova.'
              : 'A senha acima passa a ser a senha definitiva do usuário.'}
          </p>
        </div>
        <div className="form-actions">
          <button type="submit" className="btn" disabled={redefinir.isPending}>
            {redefinir.isPending ? 'Gravando...' : 'Redefinir senha'}
          </button>
          {redefinir.isSuccess && (
            <span className="badge badge-success">
              {redefinir.data?.trocarSenha
                ? 'Senha redefinida — troca exigida no próximo login'
                : 'Senha redefinida'}
            </span>
          )}
        </div>
        {redefinir.isError && (
          <p className="erro">{(redefinir.error as Error).message}</p>
        )}
      </form>
    </section>
  );
}
