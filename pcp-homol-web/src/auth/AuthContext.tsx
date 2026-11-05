import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  fetchMe,
  login as loginApi,
  type AuthUser,
  type LoginResponse,
} from '../api/auth';

const TOKEN_KEY = 'pcp_access_token';
const USER_KEY = 'pcp_user';

type AuthContextValue = {
  token: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  /** true se o usuário é admin ou tem a permissão informada. */
  can: (permissao: string) => boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  /** Busca de novo os dados do usuário logado (ex.: após trocar a senha). */
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function loadUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    const u = JSON.parse(raw) as Partial<AuthUser>;
    // Sessões antigas (antes das permissões) não têm a lista — força recarregar.
    return Array.isArray(u.permissoes) ? (u as AuthUser) : null;
  } catch {
    return null;
  }
}

function saveUser(user: AuthUser) {
  try {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch {
    /* sem storage: segue só em memória */
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem(TOKEN_KEY),
  );
  const [user, setUser] = useState<AuthUser | null>(() => loadUser());

  // Ao abrir o app com sessão salva, atualiza permissões (podem ter mudado).
  useEffect(() => {
    if (!token) return;
    let cancelado = false;
    fetchMe()
      .then((me) => {
        if (cancelado) return;
        saveUser(me);
        setUser(me);
      })
      .catch(() => {
        /* 401 já redireciona para o login em apiFetch */
      });
    return () => {
      cancelado = true;
    };
  }, [token]);

  const refreshUser = useCallback(async () => {
    const me = await fetchMe();
    saveUser(me);
    setUser(me);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      user,
      isAuthenticated: Boolean(token),
      can(permissao: string) {
        if (!user) return false;
        return user.isAdmin || user.permissoes.includes(permissao);
      },
      async login(username: string, password: string) {
        const res: LoginResponse = await loginApi(username, password);
        localStorage.setItem(TOKEN_KEY, res.accessToken);
        saveUser(res.user);
        setToken(res.accessToken);
        setUser(res.user);
      },
      logout,
      refreshUser,
    }),
    [token, user, logout, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return ctx;
}

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}
