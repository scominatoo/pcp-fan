import { validateEnv } from './validate-env';

const base = {
  DATABASE_URL: 'postgresql://pcp:x@localhost:5432/pcp',
  JWT_SECRET: 'a'.repeat(40),
};

describe('validateEnv', () => {
  it('aceita configuração válida em produção', () => {
    expect(() => validateEnv({ ...base, NODE_ENV: 'production' })).not.toThrow();
  });

  it('exige JWT_SECRET e DATABASE_URL', () => {
    expect(() => validateEnv({})).toThrow(/JWT_SECRET não definido/);
  });

  it('recusa segredo de exemplo em produção', () => {
    expect(() =>
      validateEnv({ ...base, NODE_ENV: 'production', JWT_SECRET: 'gere-um-segredo-longo-e-aleatorio' }),
    ).toThrow(/valor de exemplo/);
  });

  it('recusa JWT_SECRET curto em produção', () => {
    expect(() => validateEnv({ ...base, NODE_ENV: 'production', JWT_SECRET: 'curto' })).toThrow(/32 caracteres/);
  });

  it('recusa senha do admin em texto em produção', () => {
    expect(() =>
      validateEnv({ ...base, NODE_ENV: 'production', ADMIN_PASSWORD: 'x' }),
    ).toThrow(/ADMIN_PASSWORD_HASH/);
  });

  it('em desenvolvimento aceita valores simples', () => {
    expect(() => validateEnv({ ...base, JWT_SECRET: 'dev', ADMIN_PASSWORD: 'x' })).not.toThrow();
  });
});
