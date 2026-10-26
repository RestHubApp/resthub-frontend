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
const enCI = process.env['CI'] !== undefined
const WORKERS = enCI ? 2 : 4

// El celular del mesero: 390 px de ancho, táctil.
const MOBILE = { ...devices['Pixel 7'], viewport: { width: 390, height: 844 } }
const DESKTOP = { ...devices['Desktop Chrome'], viewport: { width: 1366, height: 900 } }

// En WSL sin root, WebKit se lanza con un envoltorio que agrega las librerías
// del sistema que faltan (ver e2e/README.md). En el CI no hace falta.
const webkitLauncher = process.env['E2E_WEBKIT_EXECUTABLE']
const WEBKIT = webkitLauncher === undefined ? {} : { launchOptions: { executablePath: webkitLauncher } }

const VISUAL = /visual\/.*\.spec\.ts/u

// Cada corrida limpia su carpeta de resultados: dos corridas a la vez (por
// ejemplo, la E2E y la visual) necesitan carpetas distintas.
const OUTPUT = process.env['E2E_OUTPUT'] ?? './e2e/.results'
const REPORT = process.env['E2E_REPORT'] ?? './e2e/.report'
// En el CI la E2E se reparte en varias máquinas (`--shard`): cada una deja su parte
// en formato blob y el job «E2E (Playwright)» las junta en un solo reporte HTML.
const BLOB = process.env['E2E_BLOB_DIR']

export default defineConfig({
  testDir: './e2e',
  outputDir: OUTPUT,
  fullyParallel: true,
  forbidOnly: enCI,
  // Una prueba intermitente se arregla, no se reintenta.
  retries: 0,
  workers: process.env['E2E_WORKERS'] === undefined ? WORKERS : Number(process.env['E2E_WORKERS']),
  timeout: 45_000,
  expect: {
    timeout: 8_000,
    toHaveScreenshot: { animations: 'disabled', caret: 'hide', scale: 'css', maxDiffPixelRatio: 0.002 },
  },
  snapshotPathTemplate: '{testDir}/visual/baselines/{projectName}/{arg}{ext}',
  reporter: [
    ['list'],
    BLOB === undefined ? ['html', { outputFolder: REPORT, open: 'never' }] : ['blob', { outputDir: BLOB }],
    ['json', { outputFile: `${REPORT}-json/resultados.json` }],
    ['./e2e/support/reportCoverage.ts'],
  ],
  use: {
    // E2E_BASE_URL sirve otra compilación sin tocar la de 5201 (la demostración del diff visual).
    baseURL: process.env['E2E_BASE_URL'] ?? FRONT,
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
    { name: 'coverage', testMatch: /coverage\.spec\.ts/u },
    {
      name: 'desktop',
      testIgnore: [VISUAL, /coverage\.spec\.ts/u],
      grepInvert: /@only-mobile/u,
      use: DESKTOP,
    },
    {
      name: 'mobile',
      testIgnore: [VISUAL, /coverage\.spec\.ts/u],
      grep: /@mobile|@only-mobile/u,
      use: MOBILE,
    },
    // Regresión visual: las líneas base dependen del sistema operativo y de
    // sus fuentes, así que corre en local con `pnpm test:visual`, no en el CI.
    { name: 'visual-chromium-desktop', testMatch: VISUAL, use: DESKTOP },
    { name: 'visual-chromium-mobile', testMatch: VISUAL, use: MOBILE },
    {
      name: 'visual-firefox-desktop',
      testMatch: VISUAL,
      use: { ...devices['Desktop Firefox'], viewport: DESKTOP.viewport },
    },
    {
      name: 'visual-firefox-mobile',
      testMatch: VISUAL,
      // Firefox no emula `isMobile`: se prueba el ancho y el toque.
      use: { ...devices['Desktop Firefox'], viewport: MOBILE.viewport, hasTouch: true },
    },
    {
      name: 'visual-webkit-desktop',
      testMatch: VISUAL,
      use: { ...devices['Desktop Safari'], viewport: DESKTOP.viewport, ...WEBKIT },
    },
    {
      name: 'visual-webkit-mobile',
      testMatch: VISUAL,
      use: { ...devices['iPhone 13'], viewport: MOBILE.viewport, ...WEBKIT },
    },
  ],
  webServer: [
    {
      command: 'bash e2e/server/backend.sh',
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
