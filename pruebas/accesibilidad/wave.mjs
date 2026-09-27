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

const RAIZ = dirname(fileURLToPath(import.meta.url))
const EXTENSION = join(RAIZ, '.wave-ext')
const ID_TIENDA = 'jbbplnpkjmmeebjpijfedlgcdilocofh'
const URL_CRX =
  'https://clients2.google.com/service/update2/crx?response=redirect&prodversion=140.0' +
  `&acceptformat=crx2,crx3&x=id%3D${ID_TIENDA}%26uc`

/** Las seis categorías del panel de WAVE, con el nombre que usa `wave.results`. */
const CATEGORIAS = {
  errors: 'error',
  contrast: 'contrast',
  alerts: 'alert',
  features: 'feature',
  structure: 'structure',
  aria: 'aria',
}

/** Descarga y desempaqueta la extensión si falta. Devuelve su ruta y su versión. */
export async function prepararWave() {
  const manifiesto = join(EXTENSION, 'manifest.json')
  if (!existsSync(manifiesto)) {
    const respuesta = await fetch(URL_CRX, { redirect: 'follow' })
    if (!respuesta.ok) {
      throw new Error(`No se pudo descargar WAVE de la Chrome Web Store: HTTP ${respuesta.status}`)
    }
    const crx = Buffer.from(await respuesta.arrayBuffer())
    // Un CRX3 es un ZIP con una cabecera firmada delante: se recorta hasta la
    // primera firma local de ZIP (PK\x03\x04) y se descomprime.
    const inicio = crx.indexOf(Buffer.from([0x50, 0x4b, 0x03, 0x04]))
    if (inicio < 0) throw new Error('El CRX descargado no contiene un ZIP')
    const zip = join(mkdtempSync(join(tmpdir(), 'wave-crx-')), 'wave.zip')
    writeFileSync(zip, crx.subarray(inicio))
    execFileSync('unzip', ['-oq', zip, '-d', EXTENSION])
    rmSync(dirname(zip), { recursive: true, force: true })
  }
  const { version } = JSON.parse(readFileSync(manifiesto, 'utf8'))
  return { ruta: EXTENSION, version }
}

/**
 * Abre un Chromium con WAVE cargada. El contexto es persistente (las
 * extensiones no se cargan en contextos incógnito) y se borra al cerrar.
 */
export async function abrirNavegadorWave({ viewport, isMobile = false, hasTouch = false, deviceScaleFactor = 1 } = {}) {
  const { ruta } = await prepararWave()
  const perfil = mkdtempSync(join(tmpdir(), 'wave-perfil-'))
  const contexto = await chromium.launchPersistentContext(perfil, {
    headless: true,
    // 'chromium' es el headless nuevo (el navegador completo), que sí carga extensiones.
    channel: 'chromium',
    args: [`--disable-extensions-except=${ruta}`, `--load-extension=${ruta}`],
    viewport: viewport ?? { width: 1366, height: 900 },
    isMobile,
    hasTouch,
    deviceScaleFactor,
    locale: 'es-PE',
    timezoneId: 'America/Lima',
  })
  const cerrar = async () => {
    await contexto.close()
    rmSync(perfil, { recursive: true, force: true })
  }
  return { contexto, cerrar }
}

async function serviceWorkerDe(contexto) {
  const existente = contexto.serviceWorkers().find((sw) => sw.url().endsWith('/service_worker.js'))
  return existente ?? contexto.waitForEvent('serviceworker', { timeout: 15_000 })
}

/**
 * Llama a `runWave` en el service worker para la pestaña de `pagina`. Es un
 * interruptor: si WAVE ya estaba activo en la pestaña, lo apaga.
 * Devuelve si WAVE quedó activo.
 */
async function alternarWave(pagina) {
  const sw = await serviceWorkerDe(pagina.context())
  await pagina.bringToFront()
  return sw.evaluate(async (url) => {
    /* global chrome, serviceworker */
    // La extensión ve la URL de las pestañas http(s) por sus host_permissions.
    const pestanas = await chrome.tabs.query({})
    const candidatas = pestanas.filter((t) => t.url === url)
    const pestana = candidatas.find((t) => t.active) ?? candidatas[0]
    if (!pestana) throw new Error(`WAVE no encuentra la pestaña ${url}`)
    await serviceworker.func.runWave(pestana.id, pestana.url ?? '')
    return Boolean(serviceworker.func.isTabActive(pestana.id))
  }, pagina.url())
}

/**
 * Ejecuta WAVE sobre la página tal como está (con un modal abierto, si lo hay)
 * y devuelve los conteos del panel y el detalle por regla.
 */
export async function analizarConWave(pagina, { timeout = 60_000 } = {}) {
  // Si quedó un análisis anterior (misma pestaña, sin recarga), se apaga
  // primero: así el panel y los resultados son de este estado.
  await pagina.evaluate(() => {
    if (window.wave) window.wave.results = undefined
  })
  let activo = await alternarWave(pagina)
  if (!activo) {
    await pagina.waitForTimeout(500)
    activo = await alternarWave(pagina)
  }
  if (!activo) throw new Error('WAVE no quedó activo en la pestaña')

  // El análisis termina cuando `wave.min.js` publica sus resultados.
  await pagina.waitForFunction(() => window.wave?.results?.categories, null, { timeout })
  // Y el panel lateral cuando muestra los números.
  await pagina
    .frameLocator('#wave_sidebar_container iframe, iframe[src*="sidebar.html"]')
    .locator('text=Contrast Errors')
    .first()
    .waitFor({ timeout: 15_000 })
    .catch(() => undefined)
  await pagina.waitForTimeout(500)

  const categorias = await pagina.evaluate(() => JSON.parse(JSON.stringify(window.wave.results.categories)))
  const conteos = {}
  const items = []
  for (const [clave, tipo] of Object.entries(CATEGORIAS)) {
    const categoria = categorias[tipo] ?? { count: 0, items: {} }
    conteos[clave] = categoria.count ?? 0
    for (const item of Object.values(categoria.items ?? {})) {
      items.push({
        tipo,
        id: item.id,
        descripcion: item.description,
        cantidad: item.count,
        xpaths: item.xpaths ?? [],
      })
    }
  }
  return { conteos, items }
}

/** Captura la página con el panel de WAVE a la vista. */
export async function capturarWave(pagina, rutaPng) {
  await pagina.screenshot({ path: rutaPng })
  return rutaPng
}

/** Apaga WAVE en la pestaña (quita el panel y los íconos) sin recargar. */
export async function apagarWave(pagina) {
  const activo = await pagina.evaluate(() => Boolean(document.getElementById('wave_sidebar_container')))
  if (activo) await alternarWave(pagina)
}
