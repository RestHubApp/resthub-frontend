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

import { ESTADOS } from './inventario.mjs'

export const RAIZ = dirname(fileURLToPath(import.meta.url))
export const REPORTES = process.env.A11Y_REPORTES ?? join(RAIZ, 'reportes')
export const BASE_URL = process.env.A11Y_BASE_URL ?? 'http://localhost:5202'
export const API_URL = process.env.A11Y_API_URL ?? 'http://localhost:8202'
export const CLAVE = 'resthub123'

/** Cuentas de la semilla (`scripts/seed_dev.py`) y las dos de vista previa. */
export const CUENTAS = {
  encargado: { correo: 'admin@resthub.dev', acceso: '/acceso' },
  mesero: { correo: 'mesero@resthub.dev', acceso: '/acceso' },
  cocina: { correo: 'cocina@resthub.dev', acceso: '/acceso' },
  plataforma: { correo: 'plataforma@resthub.dev', acceso: '/plataforma/acceso' },
  // La pestaña que abre «Ver como…» desde el área de plataforma.
  'vp-encargado': { vistaPrevia: 'owner' },
  'vp-mesero': { vistaPrevia: 'waiter' },
}

/** Tamaños de pantalla. El móvil es el celular del mesero (390 × 844). */
export const VISTAS = {
  escritorio: { width: 1366, height: 900, isMobile: false, hasTouch: false, deviceScaleFactor: 1 },
  movil: { width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
}

export function contextoDe(vista) {
  const { width, height, ...resto } = VISTAS[vista]
  return { viewport: { width, height }, ...resto, locale: 'es-PE', timezoneId: 'America/Lima' }
}

export function lanzar(opciones = {}) {
  return chromium.launch({ headless: true, ...opciones })
}

export async function asegurarDir(ruta) {
  await mkdir(ruta, { recursive: true })
  return ruta
}

export async function escribirJson(ruta, datos) {
  await asegurarDir(dirname(ruta))
  await writeFile(ruta, `${JSON.stringify(datos, null, 2)}\n`)
}

export async function leerJson(ruta) {
  return JSON.parse(await readFile(ruta, 'utf8'))
}

/** Los estados a medir, filtrables con A11Y_SOLO=id1,id2 y A11Y_CLASE=ruta|overlay. */
export function filtrarEstados(lista = ESTADOS) {
  const solo = process.env.A11Y_SOLO?.split(',').filter(Boolean)
  const clase = process.env.A11Y_CLASE
  return lista.filter((e) => (!solo || solo.includes(e.id)) && (!clase || e.clase === clase))
}

export function filtrarVistas(estado) {
  const solo = process.env.A11Y_VISTAS?.split(',').filter(Boolean)
  return Object.keys(VISTAS).filter((v) => (!solo || solo.includes(v)) && (!estado?.vistas || estado.vistas.includes(v)))
}

let datosCache = null
export async function datos() {
  // Sin datos.json (en el CI, que mide solo las pantallas sin sesión) no hay marcadores que resolver.
  const ruta = join(REPORTES, 'datos.json')
  datosCache ??= existsSync(ruta) ? await leerJson(ruta) : {}
  return datosCache
}

/** Reemplaza `:marcador` por su valor de `datos.json`. */
export async function resolverRuta(ruta) {
  const d = await datos()
  return ruta.replace(/:([a-zA-Z]+)/gu, (_, clave) => {
    if (d[clave] === undefined || d[clave] === null) throw new Error(`Falta «${clave}» en datos.json`)
    return String(d[clave])
  })
}

const rutaSesion = (cuenta) => join(REPORTES, '.sesiones', `${cuenta}.json`)

async function llamarApi(metodo, ruta, cuerpo, token) {
  const r = await fetch(`${API_URL}/api/v1${ruta}`, {
    method: metodo,
    headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
    body: cuerpo ? JSON.stringify(cuerpo) : undefined,
  })
  if (!r.ok) throw new Error(`${metodo} ${ruta} → ${r.status}`)
  return r.json()
}

/** Lee el almacenamiento del origen de la aplicación en una página abierta. */
async function leerAlmacen(pagina) {
  return pagina.evaluate(() => ({
    local: Object.entries(localStorage).map(([name, value]) => ({ name, value })),
    sesion: Object.entries(sessionStorage).map(([name, value]) => ({ name, value })),
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
export async function iniciarSesion(navegador, cuenta) {
  const datosCuenta = CUENTAS[cuenta]
  const contexto = await navegador.newContext(contextoDe('escritorio'))
  const pagina = await contexto.newPage()
  if (datosCuenta.vistaPrevia) {
    const { access_token: token } = await llamarApi('POST', '/platform/auth/login', { email: CUENTAS.plataforma.correo, password: CLAVE })
    const { code } = await llamarApi('POST', '/platform/preview', { as: datosCuenta.vistaPrevia }, token)
    await pagina.goto(`${BASE_URL}/vista-previa#codigo=${encodeURIComponent(code)}`)
    await pagina.waitForURL((url) => !url.pathname.startsWith('/vista-previa'), { timeout: 20_000 })
  } else {
    await pagina.goto(`${BASE_URL}${datosCuenta.acceso}`)
    await pagina.getByLabel('Correo').fill(datosCuenta.correo)
    await pagina.getByLabel('Contraseña', { exact: true }).fill(CLAVE)
    await pagina.getByRole('button', { name: 'Entrar' }).click()
    await pagina.waitForURL((url) => !url.pathname.endsWith('/acceso'), { timeout: 20_000 })
  }
  await esperarListo(pagina, 'main h1')
  const almacen = await leerAlmacen(pagina)
  await escribirJson(rutaSesion(cuenta), almacen)
  await contexto.close()
  return almacen
}

const sesiones = new Map()
/** El almacenamiento de la sesión de una cuenta; inicia sesión una vez por proceso. */
export async function sesion(navegador, cuenta) {
  if (!cuenta) return null
  if (!sesiones.has(cuenta)) {
    const reutilizar = process.env.A11Y_REUTILIZAR && existsSync(rutaSesion(cuenta))
    sesiones.set(cuenta, reutilizar ? await leerJson(rutaSesion(cuenta)) : await iniciarSesion(navegador, cuenta))
  }
  return sesiones.get(cuenta)
}

/**
 * El script que deja la sesión en el almacenamiento antes de que cargue la
 * aplicación. Se usa igual en Playwright (`addInitScript`) y en Lighthouse
 * (`evaluateOnNewDocument` de Puppeteer).
 */
export function guionDeSesion(almacen) {
  const datosJson = JSON.stringify(almacen ?? { local: [], sesion: [] })
  return `(() => { try {
    const a = ${datosJson};
    for (const { name, value } of a.local) localStorage.setItem(name, value);
    for (const { name, value } of a.sesion) sessionStorage.setItem(name, value);
  } catch (e) {} })();`
}

// Un pedido en la cola sin señal (store/offlineQueue.ts), de la cuenta con sesión.
const GUION_COLA = `(() => { try {
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
export async function esperarListo(pagina, selector) {
  await pagina.waitForSelector(selector, { timeout: 20_000 })
  await pagina
    .waitForFunction(() => !document.querySelector('[aria-busy="true"], [data-slot="skeleton"]'), null, { timeout: 15_000 })
    .catch(() => undefined)
  await pagina.waitForTimeout(400)
}

async function ejecutarPaso(pagina, paso) {
  const primero = (loc) => loc.filter({ visible: true }).first()
  if (paso.boton) return primero(pagina.getByRole('button', { name: paso.boton, exact: typeof paso.boton === 'string' })).click()
  if (paso.pestana) return primero(pagina.getByRole('tab', { name: paso.pestana, exact: typeof paso.pestana === 'string' })).click()
  if (paso.opcion) return pagina.getByRole('radio', { name: paso.opcion }).first().check({ force: true })
  if (paso.fecha) {
    // Una fecha relativa a hoy, en días (-7: hace una semana), en el campo con esa etiqueta.
    const dia = new Date(Date.now() - 5 * 3600_000 + paso.dias * 86_400_000).toISOString().slice(0, 10)
    return pagina.getByLabel(paso.fecha, { exact: true }).fill(dia)
  }
  if (paso.enlace) return primero(pagina.getByRole('link', { name: paso.enlace })).click()
  if (paso.resumen) return primero(pagina.locator('summary', { hasText: paso.resumen })).click()
  if (paso.clic) return primero(pagina.locator(paso.clic)).click()
  if (paso.sinConexion) return pagina.context().setOffline(true)
  if (paso.esperar) return pagina.waitForSelector(paso.esperar, { timeout: 15_000 })
  throw new Error(`Paso desconocido: ${JSON.stringify(paso)}`)
}

/**
 * Abre un estado del inventario (ruta u overlay) en una página nueva del
 * contexto, con la sesión de su cuenta, y lo deja listo para medir.
 */
export async function abrirEstado(navegador, contexto, estado, limiteMs = 90_000) {
  let temporizador
  const limite = new Promise((_, rechazar) => {
    temporizador = setTimeout(() => rechazar(new Error(`El estado ${estado.id} no se abrió en ${limiteMs / 1000} s`)), limiteMs)
  })
  try {
    return await Promise.race([abrirEstadoSinLimite(navegador, contexto, estado), limite])
  } finally {
    clearTimeout(temporizador)
  }
}

async function abrirEstadoSinLimite(navegador, contexto, estado) {
  const almacen = await sesion(navegador, estado.cuenta)
  const pagina = await contexto.newPage()
  if (almacen) await pagina.addInitScript(guionDeSesion(almacen))
  if (estado.cola) {
    await pagina.route('**/api/v1/orders', (ruta) => (ruta.request().method() === 'POST' ? ruta.abort('internetdisconnected') : ruta.continue()))
    await pagina.addInitScript(GUION_COLA)
  }
  await pagina.goto(`${BASE_URL}${await resolverRuta(estado.ruta)}`)
  const esperaRuta = estado.clase === 'ruta' && estado.espera ? estado.espera : 'main h1, body h1'
  await esperarListo(pagina, esperaRuta)
  for (const paso of estado.pasos ?? []) {
    await ejecutarPaso(pagina, paso)
    await pagina.waitForTimeout(250)
  }
  if (estado.clase === 'overlay') {
    await pagina.waitForSelector(estado.espera, { state: 'visible', timeout: 15_000 })
    await esperarListo(pagina, estado.espera)
  }
  // Las animaciones de entrada (tw-animate-css) duran ~150 ms: se espera a que
  // terminen para que el contraste no se mida a media opacidad.
  await pagina.waitForTimeout(600)
  return pagina
}

/** Nombre de archivo de un estado en una vista. */
export const clave = (estado, vista) => `${estado.id}--${vista}`
