import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

/** Bloqueia o app até o usuário estar autenticado. */
export function RequireAuth() {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Senha redefinida com troca obrigatória: prende o usuário na tela de troca.
  if (user?.trocarSenha && location.pathname !== '/trocar-senha') {
    return <Navigate to="/trocar-senha" replace />;
  }

  return <Outlet />;
}
