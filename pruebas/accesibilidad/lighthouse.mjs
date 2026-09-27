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

import { RUTAS } from './inventario.mjs'
import { asegurarDir, BASE_URL, escribirJson, filtrarEstados, guionDeSesion, lanzar, leerJson, REPORTES, resolverRuta, sesion } from './comun.mjs'

const CATEGORIAS = ['accessibility', 'performance', 'best-practices', 'seo']
const PRESETS = { escritorio: desktopConfig, movil: undefined }
const presets = (process.env.A11Y_PRESETS ?? 'escritorio,movil').split(',')
const repetir = Number(process.env.A11Y_REPETIR ?? 1)
const dir = await asegurarDir(join(REPORTES, 'lighthouse'))

// Las sesiones se abren por la interfaz con Playwright, una vez.
const navegadorSesiones = await lanzar()
const estados = filtrarEstados(RUTAS.map((r) => ({ ...r, clase: 'ruta' })))
const almacenes = new Map()
for (const e of estados) if (e.cuenta && !almacenes.has(e.cuenta)) almacenes.set(e.cuenta, await sesion(navegadorSesiones, e.cuenta))
await navegadorSesiones.close()

// Chromium se lanza a mano con un perfil en el /tmp de Linux. No se usa
// chrome-launcher: en WSL traduce las rutas a las de Windows
// (%LOCALAPPDATA%, \\wsl.localhost\...) y el Chromium de Linux las crea como
// carpetas relativas dentro del repositorio.
const perfil = mkdtempSync(join(process.env.A11Y_TMP ?? tmpdir(), 'resthub-lighthouse-'))
const PUERTO = Number(process.env.A11Y_PUERTO_CDP ?? 9302)
const proceso = spawn(process.env.CHROME_PATH ?? chromium.executablePath(), [
  '--headless=new', '--no-first-run', '--no-default-browser-check', '--disable-gpu',
  `--remote-debugging-port=${String(PUERTO)}`, `--user-data-dir=${perfil}`, 'about:blank',
], { stdio: 'ignore' })
const chrome = { port: PUERTO, kill: () => proceso.kill() }
for (let i = 0; i < 100; i += 1) {
  const listo = await fetch(`http://127.0.0.1:${String(PUERTO)}/json/version`).then((r) => r.ok, () => false)
  if (listo) break
  await new Promise((r) => setTimeout(r, 100))
}
const navegador = await puppeteer.connect({ browserURL: `http://127.0.0.1:${chrome.port}` })

const mediana = (xs) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)]
const filas = []
for (const estado of estados) {
  for (const preset of presets) {
    const url = `${BASE_URL}${await resolverRuta(estado.ruta)}`
    const corridas = []
    // A11Y_REANUDAR=1: si la corrida se cortó, lo que ya tiene reporte no se vuelve a medir.
    const previo = join(dir, `${estado.id}--${preset}.report.json`)
    if (process.env.A11Y_REANUDAR && existsSync(previo)) {
      const lhr = JSON.parse(readFileSync(previo, 'utf8'))
      corridas.push({ lhr, report: null, carga: Number.NaN })
    }
    for (let i = corridas.length > 0 ? repetir : 0; i < repetir; i += 1) {
      const pagina = await navegador.newPage()
      if (estado.cuenta) await pagina.evaluateOnNewDocument(guionDeSesion(almacenes.get(estado.cuenta)))
      try {
        const carga = loadavg()[0]
        const resultado = await lighthouse(url, { port: chrome.port, output: ['html', 'json'], logLevel: 'error', onlyCategories: CATEGORIAS }, PRESETS[preset], pagina)
        resultado.carga = carga
        corridas.push(resultado)
      } catch (error) {
        console.log(`${estado.id} ${preset} ERROR ${error.message}`)
      }
      await pagina.close()
    }
    if (corridas.length === 0) {
      filas.push({ id: estado.id, nombre: estado.nombre, preset, error: 'Lighthouse no terminó' })
      continue
    }
    // Se guarda la corrida con el rendimiento mediano.
    const rend = corridas.map((c) => c.lhr.categories.performance.score)
    const elegida = corridas.find((c) => c.lhr.categories.performance.score === mediana(rend))
    const base = join(dir, `${estado.id}--${preset}`)
    if (elegida.report) {
      await writeFile(`${base}.report.html`, elegida.report[0])
      await writeFile(`${base}.report.json`, elegida.report[1])
    }
    const lhr = elegida.lhr
    const puntaje = (c) => Math.round((lhr.categories[c].score ?? 0) * 100)
    const fallidas = (c) =>
      lhr.categories[c].auditRefs
        .filter((r) => r.weight > 0 && lhr.audits[r.id].score !== null && lhr.audits[r.id].score < 1)
        .map((r) => ({ id: r.id, titulo: lhr.audits[r.id].title, puntaje: lhr.audits[r.id].score }))
    const fila = {
      id: estado.id,
      nombre: estado.nombre,
      preset,
      url: lhr.finalDisplayedUrl,
      version: lhr.lighthouseVersion,
      puntajes: Object.fromEntries(CATEGORIAS.map((c) => [c, puntaje(c)])),
      rendimientoCorridas: rend.map((r) => Math.round(r * 100)),
      metricas: Object.fromEntries(['first-contentful-paint', 'largest-contentful-paint', 'total-blocking-time', 'cumulative-layout-shift', 'speed-index'].map((m) => [m, lhr.audits[m]?.displayValue])),
      fallidas: Object.fromEntries(['accessibility', 'best-practices', 'seo'].map((c) => [c, fallidas(c)])),
      avisos: lhr.runWarnings,
      // Carga de la máquina (promedio de 1 min) al empezar cada corrida y el
      // índice de CPU que midió Lighthouse: con otros agentes corriendo, el
      // rendimiento simulado baja aunque la aplicación no cambie.
      cargaMaquina: corridas.map((c) => (Number.isNaN(c.carga) ? null : Number(c.carga.toFixed(1)))),
      benchmarkIndex: lhr.environment.benchmarkIndex,
    }
    filas.push(fila)
    const p = fila.puntajes
    console.log(`${`${estado.id}--${preset}`.padEnd(40)} a11y ${p.accessibility} perf ${p.performance} bp ${p['best-practices']} seo ${p.seo}  ${[...fila.fallidas.accessibility, ...fila.fallidas['best-practices'], ...fila.fallidas.seo].map((a) => a.id).join(' ')}`)
  }
}
await navegador.disconnect()
chrome.kill()
rmSync(perfil, { recursive: true, force: true })

// Resumen combinado con lo que ya había si se midió una parte.
const rutaResumen = join(dir, 'resumen.json')
const previo = existsSync(rutaResumen) && (process.env.A11Y_SOLO || process.env.A11Y_PRESETS) ? await leerJson(rutaResumen) : { filas: [] }
const nuevas = new Set(filas.map((f) => `${f.id}--${f.preset}`))
const todas = [...previo.filas.filter((f) => !nuevas.has(`${f.id}--${f.preset}`)), ...filas]
await escribirJson(rutaResumen, { fecha: new Date().toISOString(), categorias: CATEGORIAS, repetir, filas: todas })
console.log(`\nLighthouse: ${filas.length} mediciones`)
