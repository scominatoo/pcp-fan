import { FormEvent, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErro('');
    setCarregando(true);
    try {
      await login(username.trim(), password);
      navigate('/', { replace: true });
    } catch (err) {
      setErro(
        (err as Error)?.message ?? 'Não foi possível entrar. Tente novamente.',
      );
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-panel">
        <div className="login-brand">
          <span className="brand-mark" aria-hidden>
            F
          </span>
          <div>
            <h1>FANANDRI</h1>
            <p>PCP — Controle de produção</p>
          </div>
        </div>

        <form className="login-form" onSubmit={onSubmit}>
          <h2>Acesso ao sistema</h2>
          <p className="login-lead">
            Entre com o usuário administrador para continuar.
          </p>

          <label>
            Usuário
            <input
              type="text"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </label>

          <label>
            Senha
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
            />
          </label>

          {erro && <p className="erro">{erro}</p>}

          <button
            type="submit"
            className="btn btn-primary login-submit"
            disabled={carregando}
          >
            {carregando ? 'Entrando…' : 'Entrar'}
          </button>
        </form>

        <p className="login-footer">Ambiente de homologação · dados migrados do legado</p>
      </div>
    </div>
  );
}
