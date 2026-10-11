// WAVE (WebAIM) automatizado con la extensión oficial de Chrome.
//
// La extensión se descarga de la Chrome Web Store (CRX3), se desempaqueta en
// `.wave-ext/` (ignorada por git) y se carga en el Chromium de Playwright con
// un contexto persistente: las extensiones MV3 funcionan en el headless nuevo
// de Chromium, sin xvfb.
//
// Cómo se dispara: al pulsar el ícono, el service worker de WAVE ejecuta
// `serviceworker.func.runWave(tabId, url)`, que inyecta `content.js` y
// `inject.js`; este último agrega `wave.min.js` al contexto de la página, que
// evalúa el documento, deja los resultados en `window.wave.results` y abre el
// panel lateral (un iframe `sidebar.html`). Aquí se llama a esa misma función
// evaluando en el service worker, y los conteos se leen de
// `window.wave.results.categories`, que es lo que pinta el panel.
import { execFileSync } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { chromium } from 'playwright'

const ROOT = dirname(fileURLToPath(import.meta.url))
const EXTENSION = join(ROOT, '.wave-ext')
const ID_SHOP = 'jbbplnpkjmmeebjpijfedlgcdilocofh'
const URL_CRX =
  'https://clients2.google.com/service/update2/crx?response=redirect&prodversion=140.0' +
  `&acceptformat=crx2,crx3&x=id%3D${ID_SHOP}%26uc`

/** Las seis categorías del panel de WAVE, con el nombre que usa `wave.results`. */
const CATEGORIES = {
  errors: 'error',
  contrast: 'contrast',
  alerts: 'alert',
  features: 'feature',
  structure: 'structure',
  aria: 'aria',
}

/** Descarga y desempaqueta la extensión si falta. Devuelve su ruta y su versión. */
export async function prepareWave() {
  const manifest = join(EXTENSION, 'manifest.json')
  if (!existsSync(manifest)) {
    const response = await fetch(URL_CRX, { redirect: 'follow' })
    if (!response.ok) {
      throw new Error(`No se pudo descargar WAVE de la Chrome Web Store: HTTP ${response.status}`)
    }
    const crx = Buffer.from(await response.arrayBuffer())
    // Un CRX3 es un ZIP con una cabecera firmada delante: se recorta hasta la
    // primera firma local de ZIP (PK\x03\x04) y se descomprime.
    const start = crx.indexOf(Buffer.from([0x50, 0x4b, 0x03, 0x04]))
    if (start < 0) throw new Error('El CRX descargado no contiene un ZIP')
    const zip = join(mkdtempSync(join(tmpdir(), 'wave-crx-')), 'wave.zip')
    writeFileSync(zip, crx.subarray(start))
    execFileSync('unzip', ['-oq', zip, '-d', EXTENSION])
    rmSync(dirname(zip), { recursive: true, force: true })
  }
  const { version } = JSON.parse(readFileSync(manifest, 'utf8'))
  return { ruta: EXTENSION, version }
}

/**
 * Abre un Chromium con WAVE cargada. El contexto es persistente (las
 * extensiones no se cargan en contextos incógnito) y se borra al cerrar.
 */
export async function openBrowserWave({ viewport, isMobile = false, hasTouch = false, deviceScaleFactor = 1 } = {}) {
  const { ruta: route } = await prepareWave()
  const profile = mkdtempSync(join(tmpdir(), 'wave-perfil-'))
  const context = await chromium.launchPersistentContext(profile, {
    headless: true,
    // 'chromium' es el headless nuevo (el navegador completo), que sí carga extensiones.
    channel: 'chromium',
    args: [`--disable-extensions-except=${route}`, `--load-extension=${route}`],
    viewport: viewport ?? { width: 1366, height: 900 },
    isMobile,
    hasTouch,
    deviceScaleFactor,
    locale: 'es-PE',
    timezoneId: 'America/Lima',
  })
  const close = async () => {
    await context.close()
    rmSync(profile, { recursive: true, force: true })
  }
  return { contexto: context, cerrar: close }
}

async function serviceWorkerDe(context) {
  const existing = context.serviceWorkers().find((sw) => sw.url().endsWith('/service_worker.js'))
  return existing ?? context.waitForEvent('serviceworker', { timeout: 15_000 })
}

/**
 * Llama a `runWave` en el service worker para la pestaña de `pagina`. Es un
 * interruptor: si WAVE ya estaba activo en la pestaña, lo apaga.
 * Devuelve si WAVE quedó activo.
 */
async function toggleWave(page) {
  const sw = await serviceWorkerDe(page.context())
  await page.bringToFront()
  return sw.evaluate(async (url) => {
    /* global chrome, serviceworker */
    // La extensión ve la URL de las pestañas http(s) por sus host_permissions.
    const tabs = await chrome.tabs.query({})
    const candidates = tabs.filter((t) => t.url === url)
    const tab = candidates.find((t) => t.active) ?? candidates[0]
    if (!tab) throw new Error(`WAVE no encuentra la pestaña ${url}`)
    await serviceworker.func.runWave(tab.id, tab.url ?? '')
    return Boolean(serviceworker.func.isTabActive(tab.id))
  }, page.url())
}

/**
 * Ejecuta WAVE sobre la página tal como está (con un modal abierto, si lo hay)
 * y devuelve los conteos del panel y el detalle por regla.
 */
export async function analyzeWithWave(page, { timeout = 60_000 } = {}) {
  // Si quedó un análisis anterior (misma pestaña, sin recarga), se apaga
  // primero: así el panel y los resultados son de este estado.
  await page.evaluate(() => {
    if (window.wave) window.wave.results = undefined
  })
  let active = await toggleWave(page)
  if (!active) {
    await page.waitForTimeout(500)
    active = await toggleWave(page)
  }
  if (!active) throw new Error('WAVE no quedó activo en la pestaña')

  // El análisis termina cuando `wave.min.js` publica sus resultados.
  await page.waitForFunction(() => window.wave?.results?.categories, null, { timeout })
  // Y el panel lateral cuando muestra los números.
  await page
    .frameLocator('#wave_sidebar_container iframe, iframe[src*="sidebar.html"]')
    .locator('text=Contrast Errors')
    .first()
    .waitFor({ timeout: 15_000 })
    .catch(() => undefined)
  await page.waitForTimeout(500)

  const categories = await page.evaluate(() => JSON.parse(JSON.stringify(window.wave.results.categories)))
  const counts = {}
  const items = []
  for (const [password, type] of Object.entries(CATEGORIES)) {
    const category = categories[type] ?? { count: 0, items: {} }
    counts[password] = category.count ?? 0
    for (const item of Object.values(category.items ?? {})) {
      items.push({
        tipo: type,
        id: item.id,
        descripcion: item.description,
        cantidad: item.count,
        xpaths: item.xpaths ?? [],
      })
    }
  }
  return { conteos: counts, items }
}

/** Captura la página con el panel de WAVE a la vista. */
export async function captureWave(page, routePng) {
  await page.screenshot({ path: routePng })
  return routePng
}

/** Apaga WAVE en la pestaña (quita el panel y los íconos) sin recargar. */
export async function turnOffWave(page) {
  const active = await page.evaluate(() => Boolean(document.getElementById('wave_sidebar_container')))
  if (active) await toggleWave(page)
}
