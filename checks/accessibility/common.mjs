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

import { STATUSES } from './inventory.mjs'

export const ROOT = dirname(fileURLToPath(import.meta.url))
export const REPORTS = process.env.A11Y_REPORTS ?? join(ROOT, 'reports')
export const BASE_URL = process.env.A11Y_BASE_URL ?? 'http://localhost:5202'
export const API_URL = process.env.A11Y_API_URL ?? 'http://localhost:8202'
export const PASSWORD = 'resthub123'

/** Cuentas de la semilla (`scripts/seed_dev.py`) y las dos de vista previa. */
export const ACCOUNTS = {
  owner: { email: 'admin@resthub.dev', access: '/acceso' },
  waiter: { email: 'mesero@resthub.dev', access: '/acceso' },
  kitchen: { email: 'cocina@resthub.dev', access: '/acceso' },
  platform: { email: 'plataforma@resthub.dev', access: '/acceso' },
  // Un mesero que todavía no aceptó los términos: ve la puerta «Antes de empezar».
  // La crea `data.mjs` y el backend rechaza una contraseña con «RestHub»
  // (ASVS V6.2.11): lleva una propia.
  'sin-terminos': { email: 'nuevo-a11y@resthub.dev', access: '/acceso', password: 'tunki-quinua-48173' },
  // La pestaña que abre «Ver como…» desde el área de plataforma.
  'vp-encargado': { preview: 'owner' },
  'vp-mesero': { preview: 'waiter' },
}

/** Tamaños de pantalla. El móvil es el celular del mesero (390 × 844). */
export const VIEWS = {
  desktop: { width: 1366, height: 900, isMobile: false, hasTouch: false, deviceScaleFactor: 1 },
  mobile: { width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
}

export function contextOf(view) {
  const { width, height, ...rest } = VIEWS[view]
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

/** Los estados a medir, filtrables con A11Y_ONLY=id1,id2 y A11Y_CLASS=ruta|overlay. */
export function filterStatuses(list = STATUSES) {
  const only = process.env.A11Y_ONLY?.split(',').filter(Boolean)
  const kind = process.env.A11Y_CLASS
  return list.filter((e) => (!only || only.includes(e.id)) && (!kind || e.class === kind))
}

export function filterViews(status) {
  const only = process.env.A11Y_VIEWS?.split(',').filter(Boolean)
  return Object.keys(VIEWS).filter((v) => (!only || only.includes(v)) && (!status?.views || status.views.includes(v)))
}

let dataCache = null
export async function loadData() {
  // Sin datos.json (en el CI, que mide solo las pantallas sin sesión) no hay marcadores que resolver.
  const route = join(REPORTS, 'datos.json')
  dataCache ??= existsSync(route) ? await readJson(route) : {}
  return dataCache
}

/** Reemplaza `:marcador` por su valor de `datos.json`. */
export async function resolverRoute(route) {
  const d = await loadData()
  return route.replace(/:([a-zA-Z]+)/gu, (_, key) => {
    if (d[key] === undefined || d[key] === null) throw new Error(`Falta «${key}» en datos.json`)
    return String(d[key])
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
 * en el almacenamiento del navegador y las cookies del API (la sesión vive en
 * una cookie `HttpOnly`; lo guardado solo trae la cuenta), para reutilizarlo
 * en cada medición.
 *
 * - Cuentas normales (y la de plataforma): el formulario de acceso, que es uno solo.
 * - Vista previa: el administrador del sistema pide el código de un solo uso
 *   (`POST /platform/preview`, lo mismo que hace «Ver como…») y la pestaña lo
 *   canjea en `/vista-previa#codigo=…`; su sesión queda en el sessionStorage.
 */
export async function signIn(browser, account) {
  const dataAccount = ACCOUNTS[account]
  const context = await browser.newContext(contextOf('desktop'))
  const page = await context.newPage()
  if (dataAccount.preview) {
    const { access_token: token } = await callApi('POST', '/auth/login', { email: ACCOUNTS.platform.email, password: PASSWORD })
    const { code } = await callApi('POST', '/platform/preview', { as: dataAccount.preview }, token)
    await page.goto(`${BASE_URL}/vista-previa#codigo=${encodeURIComponent(code)}`)
    await page.waitForURL((url) => !url.pathname.startsWith('/vista-previa'), { timeout: 20_000 })
  } else {
    await page.goto(`${BASE_URL}${dataAccount.access}`)
    await page.getByLabel('Correo').fill(dataAccount.email)
    await page.getByLabel('Contraseña', { exact: true }).fill(dataAccount.password ?? PASSWORD)
    await page.getByRole('button', { name: 'Entrar' }).click()
    await page.waitForURL((url) => !url.pathname.endsWith('/acceso'), { timeout: 20_000 })
  }
  await waitReady(page, 'main h1')
  const storage = { ...(await readStorage(page)), cookies: await context.cookies() }
  await writeJson(routeSession(account), storage)
  await context.close()
  return storage
}

const sessions = new Map()
/** El almacenamiento de la sesión de una cuenta; inicia sesión una vez por proceso. */
export async function session(browser, account) {
  if (!account) return null
  if (!sessions.has(account)) {
    const reuse = process.env.A11Y_REUSE && existsSync(routeSession(account))
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
    for (const { name, value } of a.session) sessionStorage.setItem(name, value);
  } catch (e) {} })();`
}

// Un pedido en la cola sin señal (store/offlineQueue.ts), de la cuenta con sesión.
const SCRIPT_QUEUE = `(() => { try {
  const COLA = 'resthub.pedidos-sin-enviar.v2';
  const vp = sessionStorage.getItem('resthub.vista-previa.sesion.v1');
  const almacen = vp ? sessionStorage : localStorage;
  const s = JSON.parse(vp ?? localStorage.getItem('resthub.session.v3'));
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
  if (step.button) {
    const target = first(page.getByRole('button', { name: step.button, exact: typeof step.button === 'string' }))
    // Un botón opcional puede no estar: la sección que lo ofrece ya se montó sola al verse (pantalla ancha).
    if (step.optional && !(await target.waitFor({ state: 'visible', timeout: 2_000 }).then(() => true, () => false))) return undefined
    return target.click()
  }
  // Un elemento del menú «⋯» abierto (los menús salen en un portal, fuera de la fila).
  if (step.menuitem) return first(page.getByRole('menuitem', { name: step.menuitem, exact: true })).click()
  if (step.tab) return first(page.getByRole('tab', { name: step.tab, exact: typeof step.tab === 'string' })).click()
  // Los radios de las fichas son sr-only: fuera de la ventana para el puntero, pero con foco y clic de teclado.
  if (step.option) return page.getByRole('radio', { name: step.option }).first().evaluate((radio) => { radio.click() })
  if (step.date) {
    // Una fecha relativa a hoy, en días (-7: hace una semana), en el campo con esa etiqueta.
    const day = new Date(Date.now() - 5 * 3600_000 + step.days * 86_400_000).toISOString().slice(0, 10)
    return page.getByLabel(step.date, { exact: true }).fill(day)
  }
  if (step.link) return first(page.getByRole('link', { name: step.link })).click()
  if (step.summary) return first(page.locator('summary', { hasText: step.summary })).click()
  if (step.click) return first(page.locator(step.click)).click()
  if (step.offline) return page.context().setOffline(true)
  if (step.wait) return page.waitForSelector(step.wait, { timeout: 15_000 })
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
  const storage = await session(browser, status.account)
  const page = await context.newPage()
  if (storage) {
    await context.addCookies(storage.cookies ?? [])
    await page.addInitScript(sessionScript(storage))
  }
  if (status.queue) {
    await page.route('**/api/v1/orders', (route) => (route.request().method() === 'POST' ? route.abort('internetdisconnected') : route.continue()))
    await page.addInitScript(SCRIPT_QUEUE)
  }
  await page.goto(`${BASE_URL}${await resolverRoute(status.route)}`)
  const waitRoute = status.class === 'ruta' && status.wait ? status.wait : 'main h1, body h1'
  await waitReady(page, waitRoute)
  for (const step of status.steps ?? []) {
    await runStep(page, step)
    await page.waitForTimeout(250)
  }
  if (status.class === 'overlay') {
    await page.waitForSelector(status.wait, { state: 'visible', timeout: 15_000 })
    await waitReady(page, status.wait)
  }
  // Las animaciones de entrada (tw-animate-css) duran ~150 ms: se espera a que
  // terminen para que el contraste no se mida a media opacidad.
  await page.waitForTimeout(600)
  return page
}

/** Nombre de archivo de un estado en una vista. */
export const rowKey = (status, view) => `${status.id}--${view}`
