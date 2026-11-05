/**
 * Confere o .env antes de subir a API. Em produção (NODE_ENV=production)
 * recusa valores de exemplo ou fracos, para não ir ao ar com segredo padrão.
 */
const VALORES_DE_EXEMPLO = [
  'gere-um-segredo-longo-e-aleatorio',
  'altere-senha-forte-do-banco',
  'pcp_dev_secret',
];

export function validateEnv(env: Record<string, unknown>) {
  const erros: string[] = [];
  const prod = env.NODE_ENV === 'production';
  const get = (k: string) => (typeof env[k] === 'string' ? (env[k] as string) : '');

  if (!get('DATABASE_URL')) erros.push('DATABASE_URL não definido.');
  if (!get('JWT_SECRET')) erros.push('JWT_SECRET não definido.');

  if (prod) {
    const jwt = get('JWT_SECRET');
    if (jwt && jwt.length < 32) erros.push('JWT_SECRET precisa ter pelo menos 32 caracteres.');
    for (const k of ['JWT_SECRET', 'DATABASE_URL']) {
      if (VALORES_DE_EXEMPLO.some((v) => get(k).includes(v))) {
        erros.push(`${k} ainda usa o valor de exemplo do .env.example.`);
      }
    }
    if (get('ADMIN_PASSWORD')) {
      erros.push('ADMIN_PASSWORD (senha em texto) não é aceito em produção — use ADMIN_PASSWORD_HASH.');
    }
  }

  if (erros.length) {
    throw new Error(`Configuração inválida no .env:\n - ${erros.join('\n - ')}`);
  }
  return env;
}
