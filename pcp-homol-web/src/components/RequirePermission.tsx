import type { ReactNode } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { EmptyState, LoadingState } from './StateMessage';

type Props = {
  /** Basta ter UMA das permissões listadas. */
  perm: string | string[];
  children: ReactNode;
};

/** Mostra a página só para quem tem a permissão; senão exibe "Sem acesso". */
export function RequirePermission({ perm, children }: Props) {
  const { user, can } = useAuth();
  if (!user) return <LoadingState />;

  const lista = Array.isArray(perm) ? perm : [perm];
  if (!lista.some((p) => can(p))) {
    return (
      <EmptyState
        title="Sem acesso"
        description="Você não tem permissão para acessar esta página. Fale com o administrador do sistema."
      />
    );
  }
  return <>{children}</>;
}

/**
 * Para rotas "modulo/:id" que servem tanto "novo" quanto um registro existente:
 * "novo" exige `<modulo>.criar`; os demais exigem `<modulo>.ver`.
 */
export function RequireFormPermission({
  modulo,
  children,
}: {
  modulo: string;
  children: ReactNode;
}) {
  const { id } = useParams();
  const perm = id === 'novo' ? `${modulo}.criar` : `${modulo}.ver`;
  return <RequirePermission perm={perm}>{children}</RequirePermission>;
}
