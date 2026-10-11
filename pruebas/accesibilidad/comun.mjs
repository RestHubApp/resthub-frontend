// Configuración común de las mediciones de accesibilidad (axe, Lighthouse y WAVE).
//
// Todo corre en local contra el build de producción servido con `vite preview`
// y un backend propio con la semilla de desarrollo. Nada apunta a un entorno
// desplegado.
import { existsSync } from 'node:fs'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { chromium } from 'playwright'

import { STATUSES } from './inventario.mjs'

export const ROOT = dirname(fileURLToPath(import.meta.url))
export const REPORTS = process.env.A11Y_REPORTES ?? join(ROOT, 'reportes')
export const BASE_URL = process.env.A11Y_BASE_URL ?? 'http://localhost:5202'
export const API_URL = process.env.A11Y_API_URL ?? 'http://localhost:8202'
export const PASSWORD = 'resthub123'

/** Cuentas de la semilla (`scripts/seed_dev.py`) y las dos de vista previa. */
export const ACCOUNTS = {
  owner: { email: 'admin@resthub.dev', access: '/acceso' },
  waiter: { email: 'mesero@resthub.dev', access: '/acceso' },
  kitchen: { email: 'cocina@resthub.dev', access: '/acceso' },
  platform: { email: 'plataforma@resthub.dev', access: '/plataforma/acceso' },
  // Un mesero que todavía no aceptó los términos: ve la puerta «Antes de empezar».
  'sin-terminos': { email: 'nuevo-a11y@resthub.dev', access: '/acceso' },
  // La pestaña que abre «Ver como…» desde el área de plataforma.
  'vp-encargado': { preview: 'owner' },
  'vp-mesero': { preview: 'waiter' },
}

/** Tamaños de pantalla. El móvil es el celular del mesero (390 × 844). */
export const VIEWS = {
  desktop: { width: 1366, height: 900, isMobile: false, hasTouch: false, deviceScaleFactor: 1 },
  movil: { width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
}

export function contextOf(vista) {
  const { width, height, ...rest } = VIEWS[vista]
  return { viewport: { width, height }, ...rest, locale: 'es-PE', timezoneId: 'America/Lima' }
}

export function launch(options = {}) {
  return chromium.launch({ headless: true, ...options })
}

export async function ensureDir(route) {
  await mkdir(route, { recursive: true })
  return route
}

export async function writeJson(route, data) {
  await ensureDir(dirname(route))
  await writeFile(route, `${JSON.stringify(data, null, 2)}\n`)
}

export async function readJson(route) {
  return JSON.parse(await readFile(route, 'utf8'))
}

/** Los estados a medir, filtrables con A11Y_SOLO=id1,id2 y A11Y_CLASE=ruta|overlay. */
export function filterStatuses(list = STATUSES) {
  const only = process.env.A11Y_SOLO?.split(',').filter(Boolean)
  const kind = process.env.A11Y_CLASE
  return list.filter((e) => (!only || only.includes(e.id)) && (!kind || e.class === kind))
}

export function filterViews(status) {
  const only = process.env.A11Y_VISTAS?.split(',').filter(Boolean)
  return Object.keys(VIEWS).filter((v) => (!only || only.includes(v)) && (!status?.vistas || status.vistas.includes(v)))
}

let dataCache = null
export async function handleData() {
  // Sin datos.json (en el CI, que mide solo las pantallas sin sesión) no hay marcadores que resolver.
  const route = join(REPORTS, 'datos.json')
  dataCache ??= existsSync(route) ? await readJson(route) : {}
  return dataCache
}

/** Reemplaza `:marcador` por su valor de `datos.json`. */
export async function resolverRoute(route) {
  const d = await handleData()
  return route.replace(/:([a-zA-Z]+)/gu, (_, password) => {
    if (d[password] === undefined || d[password] === null) throw new Error(`Falta «${password}» en datos.json`)
    return String(d[password])
  })
}

const routeSession = (account) => join(REPORTS, '.sesiones', `${account}.json`)

async function callApi(method, route, body, token) {
  const r = await fetch(`${API_URL}/api/v1${route}`, {
    method,
    headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!r.ok) throw new Error(`${method} ${route} → ${r.status}`)
  return r.json()
}

/** Lee el almacenamiento del origen de la aplicación en una página abierta. */
async function readStorage(page) {
  return page.evaluate(() => ({
    local: Object.entries(localStorage).map(([name, value]) => ({ name, value })),
    session: Object.entries(sessionStorage).map(([name, value]) => ({ name, value })),
  }))
}

/**
 * Inicia sesión como lo haría una persona y guarda lo que la aplicación dejó
 * en el almacenamiento del navegador, para reutilizarlo en cada medición.
 *
 * - Cuentas normales: el formulario de acceso (o el de plataforma).
 * - Vista previa: el administrador del sistema pide el código de un solo uso
 *   (`POST /platform/preview`, lo mismo que hace «Ver como…») y la pestaña lo
 *   canjea en `/vista-previa#codigo=…`; su sesión queda en el sessionStorage.
 */
export async function signIn(browser, account) {
  const dataAccount = ACCOUNTS[account]
  const context = await browser.newContext(contextOf('escritorio'))
  const page = await context.newPage()
  if (dataAccount.vistaPrevia) {
    const { access_token: token } = await callApi('POST', '/platform/auth/login', { email: ACCOUNTS.platform.email, password: PASSWORD })
    const { code } = await callApi('POST', '/platform/preview', { as: dataAccount.vistaPrevia }, token)
    await page.goto(`${BASE_URL}/vista-previa#codigo=${encodeURIComponent(code)}`)
    await page.waitForURL((url) => !url.pathname.startsWith('/vista-previa'), { timeout: 20_000 })
  } else {
    await page.goto(`${BASE_URL}${dataAccount.acceso}`)
    await page.getByLabel('Correo').fill(dataAccount.correo)
    await page.getByLabel('Contraseña', { exact: true }).fill(PASSWORD)
    await page.getByRole('button', { name: 'Entrar' }).click()
    await page.waitForURL((url) => !url.pathname.endsWith('/acceso'), { timeout: 20_000 })
  }
  await waitReady(page, 'main h1')
  const storage = await readStorage(page)
  await writeJson(routeSession(account), storage)
  await context.close()
  return storage
}

const sessions = new Map()
/** El almacenamiento de la sesión de una cuenta; inicia sesión una vez por proceso. */
export async function session(browser, account) {
  if (!account) return null
  if (!sessions.has(account)) {
    const reuse = process.env.A11Y_REUTILIZAR && existsSync(routeSession(account))
    sessions.set(account, reuse ? await readJson(routeSession(account)) : await signIn(browser, account))
  }
  return sessions.get(account)
}

/**
 * El script que deja la sesión en el almacenamiento antes de que cargue la
 * aplicación. Se usa igual en Playwright (`addInitScript`) y en Lighthouse
 * (`evaluateOnNewDocument` de Puppeteer).
 */
export function sessionScript(storage) {
  const dataJson = JSON.stringify(storage ?? { local: [], session: [] })
  return `(() => { try {
    const a = ${dataJson};
    for (const { name, value } of a.local) localStorage.setItem(name, value);
    for (const { name, value } of a.sesion) sessionStorage.setItem(name, value);
  } catch (e) {} })();`
}

// Un pedido en la cola sin señal (store/offlineQueue.ts), de la cuenta con sesión.
const SCRIPT_QUEUE = `(() => { try {
  const COLA = 'resthub.pedidos-sin-enviar.v2';
  const vp = sessionStorage.getItem('resthub.vista-previa.sesion.v1');
  const almacen = vp ? sessionStorage : localStorage;
  const s = JSON.parse(vp ?? localStorage.getItem('resthub.session.v2'));
  if (!almacen.getItem(COLA)) almacen.setItem(COLA, JSON.stringify([{
    userId: s.account.user.id, restaurantId: s.account.restaurant.id, label: 'Para llevar · Ana',
    queuedAt: new Date().toISOString(), request: { type: 'takeaway', customer_name: 'Ana', items: [{ menu_item_id: 1, quantity: 1 }] },
  }]));
} catch (e) {} })();`

/**
 * Espera a que la pantalla termine de cargar. No sirve `networkidle`: el canal
 * de avisos en vivo (`/events`) y la precarga en ratos libres mantienen la red
 * ocupada. Se espera el selector y que no quede ninguna silueta de carga.
 */
export async function waitReady(page, selector) {
  await page.waitForSelector(selector, { timeout: 20_000 })
  await page
    .waitForFunction(() => !document.querySelector('[aria-busy="true"], [data-slot="skeleton"]'), null, { timeout: 15_000 })
    .catch(() => undefined)
  await page.waitForTimeout(400)
}

async function runStep(page, step) {
  const first = (loc) => loc.filter({ visible: true }).first()
  if (step.boton) return first(page.getByRole('button', { name: step.boton, exact: typeof step.boton === 'string' })).click()
  if (step.pestana) return first(page.getByRole('tab', { name: step.pestana, exact: typeof step.pestana === 'string' })).click()
  if (step.opcion) return page.getByRole('radio', { name: step.opcion }).first().check({ force: true })
  if (step.fecha) {
    // Una fecha relativa a hoy, en días (-7: hace una semana), en el campo con esa etiqueta.
    const day = new Date(Date.now() - 5 * 3600_000 + step.dias * 86_400_000).toISOString().slice(0, 10)
    return page.getByLabel(step.fecha, { exact: true }).fill(day)
  }
  if (step.enlace) return first(page.getByRole('link', { name: step.enlace })).click()
  if (step.resumen) return first(page.locator('summary', { hasText: step.resumen })).click()
  if (step.clic) return first(page.locator(step.clic)).click()
  if (step.sinConexion) return page.context().setOffline(true)
  if (step.esperar) return page.waitForSelector(step.esperar, { timeout: 15_000 })
  throw new Error(`Paso desconocido: ${JSON.stringify(step)}`)
}

/**
 * Abre un estado del inventario (ruta u overlay) en una página nueva del
 * contexto, con la sesión de su cuenta, y lo deja listo para medir.
 */
export async function openStatus(browser, context, status, limitMs = 90_000) {
  let timer
  const limit = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`El estado ${status.id} no se abrió en ${limitMs / 1000} s`)), limitMs)
  })
  try {
    return await Promise.race([openStatusWithoutLimit(browser, context, status), limit])
  } finally {
    clearTimeout(timer)
  }
}

async function openStatusWithoutLimit(browser, context, status) {
  const storage = await session(browser, status.cuenta)
  const page = await context.newPage()
  if (storage) await page.addInitScript(sessionScript(storage))
  if (status.cola) {
    await page.route('**/api/v1/orders', (route) => (route.request().method() === 'POST' ? route.abort('internetdisconnected') : route.continue()))
    await page.addInitScript(SCRIPT_QUEUE)
  }
  await page.goto(`${BASE_URL}${await resolverRoute(status.ruta)}`)
  const waitRoute = status.clase === 'ruta' && status.espera ? status.espera : 'main h1, body h1'
  await waitReady(page, waitRoute)
  for (const step of status.pasos ?? []) {
    await runStep(page, step)
    await page.waitForTimeout(250)
  }
  if (status.clase === 'overlay') {
    await page.waitForSelector(status.espera, { state: 'visible', timeout: 15_000 })
    await waitReady(page, status.espera)
  }
  // Las animaciones de entrada (tw-animate-css) duran ~150 ms: se espera a que
  // terminen para que el contraste no se mida a media opacidad.
  await page.waitForTimeout(600)
  return page
}

/** Nombre de archivo de un estado en una vista. */
export const handlePassword = (status, vista) => `${status.id}--${vista}`
