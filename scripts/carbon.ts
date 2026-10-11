// Huella de carbono de la primera visita de cada ruta (Sustainable Web Design v4,
// la misma de websitecarbon.com) y su nota, de A+ a F. Falla si una ruta baja
// de la nota mínima (A+).
//
// Uso:  pnpm carbon                    modo estático: suma el tamaño comprimido (brotli)
//                                      de lo que la ruta carga según el manifest de Vite.
//       pnpm carbon:browser            modo navegador: mide con Chromium (Playwright) los
//                                      bytes que de verdad viajan. Es el del CI.
// Opciones: --dist <carpeta>  usa esa compilación (con manifest) en vez de compilar
//           --min-grade <nota>  nota mínima (A+ por defecto)
//           --settle <ms>  espera tras `load` en modo navegador (10 000 por defecto)
//           --verbose  lista los archivos más pesados de cada ruta
//           --json <archivo>  guarda el resultado
import { writeFileSync } from 'node:fs'
import { parseArgs } from 'node:util'

import { build, preview } from 'vite'

import { browserVisit, launchChromium } from './carbon/browserMode.ts'
import { parseGrade, type Grade } from './carbon/grade.ts'
import { heaviestLines, resultOf, summaryLines, type RouteResult } from './carbon/report.ts'
import { totalBytes, unique, type Resource } from './carbon/resources.ts'
import { OFFLINE_SCREENS, ROUTES, type Route } from './carbon/routes.ts'
import { serviceWorkerVisit } from './carbon/serviceWorker.ts'
import { offlinePack, staticVisit } from './carbon/staticMode.ts'

const BUILD_DIR = 'dist-carbon'
const PREVIEW_PORT = 5301
const DEFAULT_SETTLE_MS = 10_000
const HEAVIEST_COUNT = 8

interface Settings {
  readonly mode: 'static' | 'browser'
  readonly dist: string | undefined
  readonly minimum: Grade
  readonly settleMs: number
  readonly isVerbose: boolean
  readonly jsonFile: string | undefined
}

function readSettings(): Settings {
  const { values } = parseArgs({
    options: {
      mode: { type: 'string', default: 'static' },
      dist: { type: 'string' },
      'min-grade': { type: 'string', default: 'A+' },
      settle: { type: 'string', default: String(DEFAULT_SETTLE_MS) },
      verbose: { type: 'boolean', default: false },
      json: { type: 'string' },
    },
  })
  if (values.mode !== 'static' && values.mode !== 'browser') {
    throw new Error('--mode es static o browser.')
  }
  return {
    mode: values.mode,
    dist: values.dist,
    minimum: parseGrade(values['min-grade']),
    settleMs: Number(values.settle),
    isVerbose: values.verbose,
    jsonFile: values.json,
  }
}

/** Compila para producción en una carpeta propia, con manifest, sin tocar `dist`. */
async function buildForMeasuring(): Promise<string> {
  await build({ logLevel: 'warn', configLoader: 'runner', build: { outDir: BUILD_DIR, emptyOutDir: true, manifest: true } })
  return BUILD_DIR
}

function staticVisits(dist: string): Map<Route, Resource[]> {
  return new Map(ROUTES.map((route) => [route, staticVisit(dist, route)]))
}

/** Sirve la compilación como en producción (con sus cabeceras) y mide cada ruta en Chromium. */
async function browserVisits(dist: string, settleMs: number): Promise<Map<Route, Resource[]>> {
  const server = await preview({ logLevel: 'warn', configLoader: 'runner', build: { outDir: dist }, preview: { port: PREVIEW_PORT, strictPort: true, host: '127.0.0.1' } })
  const browser = await launchChromium()
  try {
    const base = `http://127.0.0.1:${String(PREVIEW_PORT)}`
    const visits = new Map<Route, Resource[]>()
    for (const route of ROUTES) {
      visits.set(route, await browserVisit({ browser, base, route, settleMs }))
    }
    return visits
  } finally {
    await browser.close()
    await server.close()
  }
}

function report(results: readonly RouteResult[], dist: string, settings: Settings): void {
  console.warn(`Huella de la primera visita (SWD v4, modo ${settings.mode}, nota mínima ${settings.minimum})`)
  for (const line of summaryLines(results)) console.warn(line)
  const pack = totalBytes(offlinePack(dist, OFFLINE_SCREENS))
  console.warn(`Paquete sin señal (una vez por celular, ya con sesión; no cuenta arriba): ${(pack / 1000).toFixed(1)} kB`)
  if (settings.isVerbose) {
    for (const result of results) {
      console.warn(`\n${result.route.path}`)
      for (const line of heaviestLines(result, HEAVIEST_COUNT)) console.warn(line)
    }
  }
}

async function main(): Promise<void> {
  const settings = readSettings()
  const dist = settings.dist ?? (await buildForMeasuring())
  const pages = settings.mode === 'browser' ? await browserVisits(dist, settings.settleMs) : staticVisits(dist)
  // La instalación del service worker también descarga en la primera visita.
  const worker = serviceWorkerVisit(dist)
  const results = ROUTES.map((route) => resultOf(route, unique([...(pages.get(route) ?? []), ...worker]), settings.minimum))
  report(results, dist, settings)
  if (settings.jsonFile !== undefined) {
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- el archivo lo pide quien corre el script
    writeFileSync(settings.jsonFile, `${JSON.stringify(results.map(({ route, bytes, grams, grade }) => ({ path: route.path, bytes, grams, grade })), null, 2)}\n`)
  }
  if (results.some((result) => !result.passes)) {
    console.error(`Alguna ruta bajó de ${settings.minimum}.`)
    process.exitCode = 1
  }
}

await main()
