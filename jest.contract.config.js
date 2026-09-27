// Configuración de Jest para las pruebas de contrato del consumidor (Pact).
//
// Reutiliza la compilación de las pruebas unitarias (Babel, import.meta.env,
// alias) y cambia solo lo propio del contrato:
// - corre `src/**/*.pact.ts`, que `pnpm test` no toma;
// - en Node y sin DOM: el cliente HTTP real habla con el servidor simulado de
//   Pact por la red local;
// - en un solo proceso, porque todos los archivos escriben el mismo contrato
//   en `pacts/` y Pact los junta interacción por interacción.

import base from './jest.config.js'

/** @type {import('jest').Config} */
export default {
  ...base,
  testEnvironment: 'node',
  testMatch: ['**/*.pact.ts'],
  setupFilesAfterEnv: [],
  maxWorkers: 1,
  testTimeout: 30_000,
  collectCoverageFrom: undefined,
}
