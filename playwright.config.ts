import { defineConfig, devices } from '@playwright/test'

// Pruebas de extremo a extremo y de regresión visual de RestHub.
//
// `webServer` levanta el backend (base SQLite propia, recién migrada y
// sembrada) y la compilación de producción del frontend. Los puertos son los
// de este tipo de prueba en la máquina de desarrollo: 8201 y 5201.
const BACKEND_PORT = 8201
const FRONT_PORT = 5201
const FRONT = `http://localhost:${String(FRONT_PORT)}`
const API = `http://localhost:${String(BACKEND_PORT)}`
const enCI = process.env.CI !== undefined
const TRABAJADORES = enCI ? 2 : 4

// El celular del mesero: 390 px de ancho, táctil.
const CELULAR = { ...devices['Pixel 7'], viewport: { width: 390, height: 844 } }
const ESCRITORIO = { ...devices['Desktop Chrome'], viewport: { width: 1366, height: 900 } }

// En WSL sin root, WebKit se lanza con un envoltorio que agrega las librerías
// del sistema que faltan (ver e2e/README.md). En el CI no hace falta.
const webkitLanzador = process.env.E2E_WEBKIT_EXECUTABLE
const WEBKIT = webkitLanzador === undefined ? {} : { launchOptions: { executablePath: webkitLanzador } }

const VISUAL = /visual\/.*\.spec\.ts/u

export default defineConfig({
  testDir: './e2e',
  outputDir: './e2e/.resultados',
  fullyParallel: true,
  forbidOnly: enCI,
  // Una prueba intermitente se arregla, no se reintenta.
  retries: 0,
  workers: process.env.E2E_WORKERS === undefined ? TRABAJADORES : Number(process.env.E2E_WORKERS),
  timeout: 45_000,
  expect: {
    timeout: 8_000,
    toHaveScreenshot: { animations: 'disabled', caret: 'hide', scale: 'css', maxDiffPixelRatio: 0.002 },
  },
  snapshotPathTemplate: '{testDir}/visual/lineas-base/{projectName}/{arg}{ext}',
  reporter: [
    ['list'],
    ['html', { outputFolder: './e2e/.reporte', open: 'never' }],
    ['json', { outputFile: './e2e/.reporte/resultados.json' }],
    ['./e2e/soporte/reporteCobertura.ts'],
  ],
  use: {
    baseURL: FRONT,
    locale: 'es-PE',
    timezoneId: 'America/Lima',
    // El service worker de la PWA guarda el armazón; en una prueba solo agrega
    // recargas que nadie pidió. La cola sin señal no depende de él.
    serviceWorkers: 'block',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'off',
  },
  projects: [
    { name: 'cobertura', testMatch: /cobertura\.spec\.ts/u },
    {
      name: 'escritorio',
      testIgnore: [VISUAL, /cobertura\.spec\.ts/u],
      grepInvert: /@solo-movil/u,
      use: ESCRITORIO,
    },
    {
      name: 'movil',
      testIgnore: [VISUAL, /cobertura\.spec\.ts/u],
      grep: /@movil|@solo-movil/u,
      use: CELULAR,
    },
    // Regresión visual: las líneas base dependen del sistema operativo y de
    // sus fuentes, así que corre en local con `pnpm test:visual`, no en el CI.
    { name: 'visual-chromium-escritorio', testMatch: VISUAL, use: ESCRITORIO },
    { name: 'visual-chromium-movil', testMatch: VISUAL, use: CELULAR },
    {
      name: 'visual-firefox-escritorio',
      testMatch: VISUAL,
      use: { ...devices['Desktop Firefox'], viewport: ESCRITORIO.viewport },
    },
    {
      name: 'visual-firefox-movil',
      testMatch: VISUAL,
      // Firefox no emula `isMobile`: se prueba el ancho y el toque.
      use: { ...devices['Desktop Firefox'], viewport: CELULAR.viewport, hasTouch: true },
    },
    {
      name: 'visual-webkit-escritorio',
      testMatch: VISUAL,
      use: { ...devices['Desktop Safari'], viewport: ESCRITORIO.viewport, ...WEBKIT },
    },
    {
      name: 'visual-webkit-movil',
      testMatch: VISUAL,
      use: { ...devices['iPhone 13'], viewport: CELULAR.viewport, ...WEBKIT },
    },
  ],
  webServer: [
    {
      command: 'bash e2e/servidor/backend.sh',
      url: `${API}/api/v1/health`,
      reuseExistingServer: !enCI,
      timeout: 180_000,
      stdout: 'ignore',
      stderr: 'pipe',
    },
    {
      command: `pnpm exec vite build --outDir dist-e2e && pnpm exec vite preview --outDir dist-e2e --port ${String(FRONT_PORT)} --strictPort`,
      url: FRONT,
      reuseExistingServer: !enCI,
      timeout: 180_000,
      env: { VITE_API_URL: API },
      stdout: 'ignore',
      stderr: 'pipe',
    },
  ],
})
