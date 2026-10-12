// Pruebas de mutación de la lógica de negocio del frontend (no va en el CI:
// tarda decenas de minutos). Se corre con `pnpm test:mutation`.
//
// Alcance: servicios, estado y utilidades puras de las características (el
// cobro dividido, boleta o factura, la cola sin conexión, los permisos, los
// esquemas de los formularios...). Quedan fuera los componentes visuales, que
// se prueban con React Testing Library, los hooks de React (`use*.ts`) y las
// precargas (`prefetch*.ts`), que solo encadenan consultas.

const area = process.env.STRYKER_AREA;
const defaultExcludes = [
  '!src/**/*.test.ts',
  '!src/**/*.d.ts',
  '!src/features/**/use*.ts',
  '!src/features/**/prefetch*.ts',
];

const defaultMutate = [
  'src/services/**/*.ts',
  'src/store/**/*.ts',
  'src/features/**/*.ts',
  ...defaultExcludes,
];

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
  mutate: process.env.STRYKER_MUTATE
    ? [...process.env.STRYKER_MUTATE.split(','), ...defaultExcludes]
    : defaultMutate,
  coverageAnalysis: 'perTest',
  // La máquina se comparte con otras suites de pruebas (concurrency: 2 para no agotar memoria).
  concurrency: 2,
  // Reutiliza los resultados de la corrida anterior para lo que no cambió.
  incremental: true,
  incrementalFile: area ? `reports/mutation/${area}/stryker-incremental.json` : 'reports/mutation/stryker-incremental.json',
  timeoutMS: 20_000,
  reporters: ['clear-text', 'progress', 'html', 'json'],
  htmlReporter: { fileName: area ? `reports/mutation/${area}/index.html` : 'reports/mutation/index.html' },
  jsonReporter: { fileName: area ? `reports/mutation/${area}/mutation.json` : 'reports/mutation/mutation.json' },
  thresholds: { high: 80, low: 70, break: 70 },
  tempDirName: '.stryker-tmp',
  cleanTempDir: 'always',
}
