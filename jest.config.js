// Configuración de Jest para las pruebas unitarias y de componentes.
//
// Vite no participa en las pruebas: Babel compila TypeScript y JSX a CommonJS,
// y lo que en la aplicación resuelve Vite (import.meta.env, el alias @/, los
// estilos y los módulos virtuales de la PWA) se resuelve aquí.

import { fileURLToPath } from 'node:url'

// Las opciones de un transformador no expanden <rootDir>: la ruta va completa.
const importMetaEnv = fileURLToPath(new URL('./jest/importMetaEnv.cjs', import.meta.url))

// Dependencias que solo traen ESM (React Router 8 y la que usa para cookies).
const soloEsm = ['react-router', 'cookie-es']

/** @type {import('jest').Config} */
export default {
  // El DOM de jsdom (con la API fetch de Node) para las pruebas de componentes. Las de lógica que simulan
  // una pestaña sin DOM (sin `window`) declaran `@jest-environment node`.
  testEnvironment: '<rootDir>/jest/jsdomEnvironment.cjs',
  roots: ['<rootDir>/src'],
  testMatch: ['**/*.test.{ts,tsx}'],
  setupFiles: ['<rootDir>/jest/setup.ts'],
  setupFilesAfterEnv: ['<rootDir>/jest/setupDom.ts'],
  transform: {
    '^.+\\.[cm]?[jt]sx?$': [
      'babel-jest',
      {
        babelrc: false,
        configFile: false,
        presets: [
          ['@babel/preset-env', { targets: { node: 'current' } }],
          ['@babel/preset-react', { runtime: 'automatic' }],
          ['@babel/preset-typescript', { allowDeclareFields: true, onlyRemoveTypeImports: true }],
        ],
        plugins: [importMetaEnv],
      },
    ],
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^#jest/(.*)$': '<rootDir>/jest/$1',
    '^virtual:pwa-register(/.*)?$': '<rootDir>/jest/pwaRegister.cjs',
    // Widget de accesibilidad de terceros: se importa por su efecto de montar
    // su propio botón en <body>, fuera de React. No es lógica de RestHub.
    '^sienna-accessibility$': '<rootDir>/jest/fileMock.cjs',
    '\\.(css|less|scss|svg|png|jpe?g|gif|webp|woff2?)(\\?.*)?$': '<rootDir>/jest/fileMock.cjs',
  },
  // Paquetes publicados solo como ESM: Babel los pasa a CommonJS como al código
  // propio. Con pnpm cada paquete vive en node_modules/.pnpm/<paquete>@…
  transformIgnorePatterns: [`/node_modules/(?!\\.pnpm/|(${soloEsm.join('|')})[@/])`],
  clearMocks: true,
  // Una pantalla perezosa del router se compila con Babel la primera vez que
  // se abre; sin caché (en el CI) eso tarda varios segundos.
  testTimeout: 20_000,
  // Cobertura sobre todo src, no solo sobre lo que importan las pruebas.
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    // Pruebas: no son código de la aplicación.
    '!src/**/*.test.{ts,tsx}',
    // Solo declaraciones de tipos (schema.d.ts lo genera openapi-typescript).
    '!src/**/*.d.ts',
    // Punto de entrada: monta React en #root y no tiene lógica propia.
    '!src/main.tsx',
  ],
  // Istanbul (instrumentación con Babel) cuenta las líneas ejecutables. El
  // proveedor v8 de Jest cuenta también comentarios y líneas en blanco de los
  // archivos que ninguna prueba carga (29 979 «líneas» en vez de 4 889).
  coverageProvider: 'babel',
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'text-summary', 'lcov', 'json-summary'],
}
