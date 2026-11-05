import { useMutation } from '@tanstack/react-query';
import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { trocarSenha } from '../api/auth';
import { useAuth } from '../auth/AuthContext';
import { PageHeader } from '../components/PageHeader';

const SENHA_MIN = 8;

export function TrocarSenhaPage() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const obrigatoria = Boolean(user?.trocarSenha);
  const [atual, setAtual] = useState('');
  const [nova, setNova] = useState('');
  const [confirmacao, setConfirmacao] = useState('');
  const [erroLocal, setErroLocal] = useState<string | null>(null);

  const salvar = useMutation({
    mutationFn: () => trocarSenha(atual, nova),
    onSuccess: async () => {
      setAtual('');
      setNova('');
      setConfirmacao('');
      await refreshUser();
      if (obrigatoria) navigate('/', { replace: true });
    },
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErroLocal(null);
    if (nova !== confirmacao) {
      setErroLocal('A confirmação não confere com a nova senha.');
      return;
    }
    salvar.mutate();
  }

  return (
    <>
      <PageHeader eyebrow="Minha conta" title="Trocar senha" />
      {obrigatoria && (
        <div className="alert alert-error">
          O administrador redefiniu a sua senha. Para continuar usando o sistema,
          cadastre uma senha nova. Em "Senha atual", use a senha que o
          administrador passou para você.
        </div>
      )}
      <section className="card">
        <form className="form" onSubmit={onSubmit}>
          <label>
            Senha atual
            <input
              type="password"
              value={atual}
              onChange={(e) => setAtual(e.target.value)}
              autoComplete="current-password"
              required
            />
          </label>
          <div className="form-row">
            <label>
              Nova senha
              <input
                type="password"
                value={nova}
                onChange={(e) => setNova(e.target.value)}
                minLength={SENHA_MIN}
                autoComplete="new-password"
                required
              />
            </label>
            <label>
              Confirmar nova senha
              <input
                type="password"
                value={confirmacao}
                onChange={(e) => setConfirmacao(e.target.value)}
                minLength={SENHA_MIN}
                autoComplete="new-password"
                required
              />
            </label>
          </div>
          {(erroLocal || salvar.isError) && (
            <p className="erro">{erroLocal ?? (salvar.error as Error).message}</p>
          )}
          {salvar.isSuccess && (
            <div className="alert alert-success">Senha alterada com sucesso.</div>
          )}
          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={salvar.isPending}>
              {salvar.isPending ? 'Salvando...' : 'Trocar senha'}
            </button>
          </div>
        </form>
      </section>
    </>
  );
}
