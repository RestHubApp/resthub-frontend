// Lighthouse sobre cada ruta del inventario, con los presets de escritorio y
// de móvil. Lighthouse no mide modales: carga la página y audita el estado
// inicial, así que los overlays solo los miden axe y WAVE.
//
// Usa el Chromium de Playwright (o CHROME_PATH). Para las pantallas con sesión
// se abre una página de Puppeteer en ese Chromium y se deja la sesión en el
// almacenamiento antes de que cargue la aplicación (`evaluateOnNewDocument`),
// la misma que dejó el inicio de sesión por la interfaz. Lighthouse borra la
// caché y el almacenamiento antes de cargar (carga en frío), y el guion vuelve
// a poner la sesión en el documento nuevo.
//
// Se corre de a una página: en esta máquina corren otros agentes y el
// rendimiento se mediría con ruido. Variables: A11Y_SOLO, A11Y_PRESETS=escritorio,movil,
// A11Y_REPETIR=n (corridas por página; se informa la mediana de rendimiento).
import { spawn } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { writeFile } from 'node:fs/promises'
import { loadavg, tmpdir } from 'node:os'
import { join } from 'node:path'

import lighthouse from 'lighthouse'
import desktopConfig from 'lighthouse/core/config/desktop-config.js'
import { chromium } from 'playwright'
import puppeteer from 'puppeteer-core'

import { ROUTES } from './inventario.mjs'
import { ensureDir, BASE_URL, writeJson, filterStatuses, sessionScript, launch, readJson, REPORTS, resolverRoute, session } from './comun.mjs'

const CATEGORIES = ['accessibility', 'performance', 'best-practices', 'seo']
const PRESETS = { escritorio: desktopConfig, movil: undefined }
const presets = (process.env.A11Y_PRESETS ?? 'escritorio,movil').split(',')
const repeat = Number(process.env.A11Y_REPETIR ?? 1)
const dir = await ensureDir(join(REPORTS, 'lighthouse'))

// Las sesiones se abren por la interfaz con Playwright, una vez.
const browserSessions = await launch()
const statuses = filterStatuses(ROUTES.map((r) => ({ ...r, clase: 'ruta' })))
const stores = new Map()
for (const e of statuses) if (e.cuenta && !stores.has(e.cuenta)) stores.set(e.cuenta, await session(browserSessions, e.cuenta))
await browserSessions.close()

// Chromium se lanza a mano con un perfil en el /tmp de Linux. No se usa
// chrome-launcher: en WSL traduce las rutas a las de Windows
// (%LOCALAPPDATA%, \\wsl.localhost\...) y el Chromium de Linux las crea como
// carpetas relativas dentro del repositorio.
const profile = mkdtempSync(join(process.env.A11Y_TMP ?? tmpdir(), 'resthub-lighthouse-'))
const PORT = Number(process.env.A11Y_PUERTO_CDP ?? 9302)
const processValue = spawn(process.env.CHROME_PATH ?? chromium.executablePath(), [
  '--headless=new', '--no-first-run', '--no-default-browser-check', '--disable-gpu',
  `--remote-debugging-port=${String(PORT)}`, `--user-data-dir=${profile}`, 'about:blank',
], { stdio: 'ignore' })
const chrome = { port: PORT, kill: () => processValue.kill() }
for (let i = 0; i < 100; i += 1) {
  const ready = await fetch(`http://127.0.0.1:${String(PORT)}/json/version`).then((r) => r.ok, () => false)
  if (ready) break
  await new Promise((r) => setTimeout(r, 100))
}
const browser = await puppeteer.connect({ browserURL: `http://127.0.0.1:${chrome.port}` })

const median = (xs) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)]
const rows = []
for (const status of statuses) {
  for (const preset of presets) {
    const url = `${BASE_URL}${await resolverRoute(status.ruta)}`
    const runs = []
    // A11Y_REANUDAR=1: si la corrida se cortó, lo que ya tiene reporte no se vuelve a medir.
    const previous = join(dir, `${status.id}--${preset}.report.json`)
    if (process.env.A11Y_REANUDAR && existsSync(previous)) {
      const lhr = JSON.parse(readFileSync(previous, 'utf8'))
      runs.push({ lhr, report: null, carga: Number.NaN })
    }
    for (let i = runs.length > 0 ? repeat : 0; i < repeat; i += 1) {
      const page = await browser.newPage()
      if (status.cuenta) await page.evaluateOnNewDocument(sessionScript(stores.get(status.cuenta)))
      try {
        const load = loadavg()[0]
        const result = await lighthouse(url, { port: chrome.port, output: ['html', 'json'], logLevel: 'error', onlyCategories: CATEGORIES }, PRESETS[preset], page)
        result.carga = load
        runs.push(result)
      } catch (error) {
        console.log(`${status.id} ${preset} ERROR ${error.message}`)
      }
      await page.close()
    }
    if (runs.length === 0) {
      rows.push({ id: status.id, nombre: status.nombre, preset, error: 'Lighthouse no terminó' })
      continue
    }
    // Se guarda la corrida con el rendimiento mediano.
    const rend = runs.map((c) => c.lhr.categories.performance.score)
    const selected = runs.find((c) => c.lhr.categories.performance.score === median(rend))
    const base = join(dir, `${status.id}--${preset}`)
    if (selected.report) {
      await writeFile(`${base}.report.html`, selected.report[0])
      await writeFile(`${base}.report.json`, selected.report[1])
    }
    const lhr = selected.lhr
    const score = (c) => Math.round((lhr.categories[c].score ?? 0) * 100)
    const failed = (c) =>
      lhr.categories[c].auditRefs
        .filter((r) => r.weight > 0 && lhr.audits[r.id].score !== null && lhr.audits[r.id].score < 1)
        .map((r) => ({ id: r.id, titulo: lhr.audits[r.id].title, puntaje: lhr.audits[r.id].score }))
    const row = {
      id: status.id,
      nombre: status.nombre,
      preset,
      url: lhr.finalDisplayedUrl,
      version: lhr.lighthouseVersion,
      puntajes: Object.fromEntries(CATEGORIES.map((c) => [c, score(c)])),
      rendimientoCorridas: rend.map((r) => Math.round(r * 100)),
      metricas: Object.fromEntries(['first-contentful-paint', 'largest-contentful-paint', 'total-blocking-time', 'cumulative-layout-shift', 'speed-index'].map((m) => [m, lhr.audits[m]?.displayValue])),
      fallidas: Object.fromEntries(['accessibility', 'best-practices', 'seo'].map((c) => [c, failed(c)])),
      avisos: lhr.runWarnings,
      // Carga de la máquina (promedio de 1 min) al empezar cada corrida y el
      // índice de CPU que midió Lighthouse: con otros agentes corriendo, el
      // rendimiento simulado baja aunque la aplicación no cambie.
      cargaMaquina: runs.map((c) => (Number.isNaN(c.carga) ? null : Number(c.carga.toFixed(1)))),
      benchmarkIndex: lhr.environment.benchmarkIndex,
    }
    rows.push(row)
    const p = row.puntajes
    console.log(`${`${status.id}--${preset}`.padEnd(40)} a11y ${p.accessibility} perf ${p.performance} bp ${p['best-practices']} seo ${p.seo}  ${[...row.fallidas.accessibility, ...row.fallidas['best-practices'], ...row.fallidas.seo].map((a) => a.id).join(' ')}`)
  }
}
await browser.disconnect()
chrome.kill()
// Chromium aún escribe en su perfil unos instantes tras `kill()`. Si se
// borra antes, WSL devuelve ENOTEMPTY y se perdería el resumen ya medido.
if (processValue.exitCode === null && processValue.signalCode === null) {
  await Promise.race([
    new Promise((resolve) => { processValue.once('exit', resolve) }),
    new Promise((resolve) => { setTimeout(resolve, 5000) }),
  ])
}
try {
  rmSync(profile, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 })
} catch (error) {
  console.warn(`No se pudo limpiar el perfil temporal ${profile}: ${error.message}`)
}

// Resumen combinado con lo que ya había si se midió una parte.
const routeSummary = join(dir, 'resumen.json')
const previousValue = existsSync(routeSummary) && (process.env.A11Y_SOLO || process.env.A11Y_PRESETS) ? await readJson(routeSummary) : { filas: [] }
const fresh = new Set(rows.map((f) => `${f.id}--${f.preset}`))
const all = [...previousValue.filas.filter((f) => !fresh.has(`${f.id}--${f.preset}`)), ...rows]
await writeJson(routeSummary, { fecha: new Date().toISOString(), categorias: CATEGORIES, repetir: repeat, filas: all })
console.log(`\nLighthouse: ${rows.length} mediciones`)
