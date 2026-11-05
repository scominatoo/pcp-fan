import { Usuario } from '@prisma/client';

/** Remove o hash da senha antes de enviar ao front. */
export function serializeUsuario(u: Usuario) {
  return {
    id: u.id,
    username: u.username,
    nome: u.nome,
    ativo: u.ativo,
    isAdmin: u.isAdmin,
    trocarSenha: u.trocarSenha,
    permissoes: u.permissoes,
    ultimoLogin: u.ultimoLogin,
    createdAt: u.createdAt,
    updatedAt: u.updatedAt,
  };
}
