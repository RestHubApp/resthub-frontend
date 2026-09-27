// Pruebas de mutación de la lógica de negocio del frontend (no va en el CI:
// tarda decenas de minutos). Se corre con `pnpm test:mutation`.
//
// Alcance: servicios, estado y utilidades puras de las características (el
// cobro dividido, boleta o factura, la cola sin conexión, los permisos, los
// esquemas de los formularios...). Quedan fuera los componentes visuales, que
// se prueban con React Testing Library, los hooks de React (`use*.ts`) y las
// precargas (`prefetch*.ts`), que solo encadenan consultas.

/** @type {import('@stryker-mutator/api/core').PartialStrykerOptions} */
export default {
  packageManager: 'pnpm',
  // Con pnpm, Stryker no encuentra solo los complementos junto a su paquete.
  plugins: ['@stryker-mutator/jest-runner', '@stryker-mutator/typescript-checker'],
  testRunner: 'jest',
  jest: {
    projectType: 'custom',
    configFile: 'jest.config.js',
    // Por cada mutante corre solo las pruebas que tocan el archivo mutado.
    enableFindRelatedTests: true,
  },
  // Un mutante que no compila se descarta sin correr las pruebas.
  checkers: ['typescript'],
  tsconfigFile: 'tsconfig.app.json',
  mutate: [
    'src/services/**/*.ts',
    'src/store/**/*.ts',
    'src/features/**/*.ts',
    '!src/**/*.test.ts',
    '!src/**/*.d.ts',
    '!src/features/**/use*.ts',
    '!src/features/**/prefetch*.ts',
  ],
  coverageAnalysis: 'perTest',
  // La máquina se comparte con otras suites de pruebas.
  concurrency: 3,
  // Reutiliza los resultados de la corrida anterior para lo que no cambió.
  incremental: true,
  incrementalFile: 'reports/mutation/stryker-incremental.json',
  timeoutMS: 20_000,
  reporters: ['clear-text', 'progress', 'html', 'json'],
  htmlReporter: { fileName: 'reports/mutation/index.html' },
  jsonReporter: { fileName: 'reports/mutation/mutation.json' },
  thresholds: { high: 80, low: 70, break: 70 },
  tempDirName: '.stryker-tmp',
  cleanTempDir: 'always',
}
