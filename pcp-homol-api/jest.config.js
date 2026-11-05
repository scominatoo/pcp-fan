/** Testes ponta a ponta: sobem a API inteira contra um banco de TESTE. */
module.exports = {
  rootDir: '.',
  testMatch: ['<rootDir>/test/**/*.spec.ts', '<rootDir>/src/**/*.spec.ts'],
  transform: { '^.+\\.ts$': 'ts-jest' },
  testEnvironment: 'node',
  testTimeout: 30000,
  // Os testes compartilham o banco; rodar em série evita interferência
  maxWorkers: 1,
};
