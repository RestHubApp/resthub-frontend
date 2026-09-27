// Lo común de las capturas de regresión visual.
//
// Cada captura tiene que salir igual en cada corrida. Para eso, antes de
// abrir la página:
//
// - Se bloquea cdn.jsdelivr.net. El widget de accesibilidad (Sienna) baja de
//   ahí su idioma y su fuente de lectura; sin el CDN cae al inglés, que no se
//   ve en ninguna captura. Así la prueba no depende de internet.
// - Se ocultan con la hoja `captura.css` el botón flotante del widget (aparece
//   cuando termina de bajar su archivo, a veces antes y a veces después de la
//   captura) y los avisos emergentes (se van solos a los pocos segundos).
// - Se normalizan las respuestas del API: los correos y los identificadores
//   de los restaurantes de prueba llevan un sufijo aleatorio que cambia el
//   ancho de las columnas; se reemplaza por uno fijo.
// - Las pantallas de plataforma que muestran lo de todas las pruebas a la vez
//   (restaurantes, bitácora, local de muestra, observabilidad) reciben datos
//   fijos (`datos.ts`).
//
// Lo que depende de la hora (fechas, horas, minutos transcurridos, cuentas
// regresivas) se enmascara en cada captura con `volatiles(page)`.
import { join } from 'node:path'

import type { Locator, Page, Request, Route } from '@playwright/test'

import { expect as expectBase, test as base } from '../soporte/fixtures'
import { BITACORA, LOCAL_DE_MUESTRA, OBSERVABILIDAD, RESTAURANTES } from './datos'


const ESTILO = join(import.meta.dirname, 'captura.css')
// Tomar una captura en WebKit bajo WSL (sin GPU, con el envoltorio de
// librerías) tarda varios segundos, más con otras pruebas corriendo: con los
// 8 s de `expect` la primera ni siquiera termina. Es el tiempo de sacar la
// foto, no una espera a que algo se estabilice.
const TIEMPO_CAPTURA = 30_000

/**
 * El `expect` de las capturas, con 15 s para que aparezca cada cosa en vez
 * de 8. El backend de prueba es uno solo para las cuatro suites que corren a
 * la vez: en los picos una lista (las recetas, las reservas) tardó más de 8 s
 * en llegar y la pantalla seguía en «Cargando…». No cambia qué se espera.
 */
export const expect = expectBase.configure({ timeout: 15_000 })
const API = '/api/v1'
const EVENTOS = `${API}/events`
const OBS = `${API}/platform/observability/`

const FIJOS: Readonly<Record<string, unknown>> = {
  [`${API}/platform/restaurants`]: RESTAURANTES,
  [`${API}/platform/activity`]: BITACORA,
  [`${API}/platform/sandbox`]: LOCAL_DE_MUESTRA,
}

/** Los sufijos aleatorios de las cuentas y los locales de prueba, con su reemplazo fijo. */
const SUFIJOS: readonly (readonly [RegExp, string])[] = [
  [/\b(encargado|mesero|cocina|vacio|cuenta)-[a-z0-9]+@e2e\.resthub\.dev/gu, '$1@e2e.resthub.dev'],
  [/\be2e-(?:vacio-)?[a-z0-9]{10,}\b/gu, 'e2e-local'],
  [/\bmuestra-[0-9a-f]{6,}\b/gu, 'muestra-local'],
]

/**
 * Las listas que muestran la fecha y la hora en una columna de tabla. La hora
 * se enmascara, pero su ancho («3:52» o «4:04») mueve las demás columnas: en
 * estas respuestas la hora del día se fija a las 12:00 de Lima. Ninguna de
 * ellas calcula tiempos transcurridos (eso sale de `/orders/active`).
 */
const LISTAS_CON_HORA: readonly RegExp[] = [
  /^\/api\/v1\/orders$/u,
  /^\/api\/v1\/inventory\/movements$/u,
  /^\/api\/v1\/cash\/sessions(?:\/\d+)?$/u,
  /^\/api\/v1\/billing\/invoices(?:\/\d+)?$/u,
  /^\/api\/v1\/billing\/orders\/\d+\/invoice$/u,
  /^\/api\/v1\/customers(?:\/\d+)?$/u,
]
const INSTANTE = /"(\d{4}-\d{2}-\d{2})T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})"/gu

// La ficha de un restaurante de plataforma muestra «Alta: <fecha y hora>»: el
// largo de ese texto (enmascarado) cambia con la hora y hacía saltar de línea
// lo que sigue. Se fija el instante entero (la ficha no calcula tiempos).
const FICHA_CON_ALTA = /^\/api\/v1\/platform\/restaurants\/\d+$/u

function normalizar(ruta: string, texto: string): string {
  const sinSufijos = SUFIJOS.reduce((actual, [patron, reemplazo]) => actual.replace(patron, reemplazo), texto)
  if (FICHA_CON_ALTA.test(ruta)) {
    return sinSufijos.replace(INSTANTE, '"2026-09-27T17:00:00Z"')
  }
  return LISTAS_CON_HORA.some((lista) => lista.test(ruta)) ? sinSufijos.replace(INSTANTE, '"$1T17:00:00Z"') : sinSufijos
}

function datoFijo(ruta: string): unknown {
  if (ruta.startsWith(OBS)) {
    const clave = ruta.slice(OBS.length) as keyof typeof OBSERVABILIDAD
    return OBSERVABILIDAD[clave]
  }
  return FIJOS[ruta]
}

async function responder(route: Route, peticion: Request): Promise<void> {
  if (peticion.method() !== 'GET') {
    await route.fallback()
    return
  }
  const ruta = new URL(peticion.url()).pathname
  const fijo = datoFijo(ruta)
  if (fijo !== undefined) {
    await route.fulfill({ json: fijo })
    return
  }
  // Sin reusar la conexión: uvicorn cierra las que quedan abiertas a los 5 s
  // y reusarla da «socket hang up» (igual que en `e2e/soporte/api.ts`). Si
  // aun así se corta, se intenta una vez más.
  const opciones = { headers: { ...peticion.headers(), connection: 'close' } }
  const respuesta = await route.fetch(opciones).catch(async () => route.fetch(opciones))
  await route.fulfill({ response: respuesta, body: normalizar(ruta, await respuesta.text()) })
}

function esApi(url: URL): boolean {
  return url.pathname.startsWith(`${API}/`) && url.pathname !== EVENTOS
}

async function preparar(page: Page): Promise<void> {
  await page.route('https://cdn.jsdelivr.net/**', (route) => route.abort())
  // El widget de accesibilidad, al iniciarse, fija en línea el tamaño de letra
  // de cada texto ya dibujado con `parseInt` (12,8 px pasa a 12 px) y no toca
  // lo que se dibuja después: según cuándo termina de bajar, el mismo enlace
  // salía de 12 o de 12,8 px. Las capturas se toman sin el widget; su menú lo
  // recorren las E2E (ACC-13 y ACC-14).
  await page.route(/\/assets\/sienna-accessibility[^/]*\.js$/u, (route) => route.abort())
  await page.route(esApi, async (route, peticion) => {
    // Si `route.fetch` falla (el servidor cortó la conexión) la petición no
    // puede quedar sin respuesta: la página seguiría en «Cargando…». Sigue
    // sin normalizar hacia el servidor. Si la página ya se cerró, no hay a
    // quién responder.
    await responder(route, peticion).catch(async () => route.continue().catch(() => undefined))
  })
}

/** Los accesorios de siempre, con la página ya preparada para capturar. */
export const test = base.extend<{ capturable: undefined }>({
  capturable: [
    async ({ page }, usar) => {
      await preparar(page)
      await usar(undefined)
      await page.unrouteAll({ behavior: 'ignoreErrors' })
    },
    { auto: true },
  ],
})

const MESES = 'ene|feb|mar|abr|may|jun|jul|ago|set|oct|nov|dic'
const MESES_LARGOS = 'enero|febrero|marzo|abril|mayo|junio|julio|agosto|setiembre|octubre|noviembre|diciembre'

/** Lo que cambia con la hora real: fechas, horas, minutos transcurridos y cuentas regresivas. */
export function volatiles(page: Page | Locator): Locator[] {
  return [
    page.getByText(/\d{1,2}:\d{2}\s?[ap]\.\s?m\./u),
    page.getByText(new RegExp(`\\b\\d{1,2} (?:${MESES})\\.?(?: \\d{4})?\\b`, 'u')),
    page.getByText(new RegExp(`\\d{1,2} de (?:${MESES_LARGOS})`, 'u')),
    page.getByText(/^\d+ min$/u),
    page.getByText(/^hace /u),
    page.getByRole('timer'),
  ]
}

export interface Opciones {
  /** Lo que se enmascara además de `volatiles`. */
  readonly mask?: readonly Locator[]
  /**
   * Toda la página o solo lo que se ve (diálogos y hojas). Por omisión, toda
   * en escritorio y lo que se ve en el celular: ahí la barra inferior es fija
   * y la captura de página completa la dibuja en medio.
   */
  readonly fullPage?: boolean
}

/** La captura de la pantalla entera, con lo volátil enmascarado. */
/**
 * Espera a que la fuente de la interfaz esté cargada en los pesos que usa.
 *
 * WebKit dibujaba a veces un texto de peso 500 con el de 400 (la fuente
 * variable todavía no había llegado para ese peso) y la línea base cambiaba
 * de una corrida a otra en los enlaces y las insignias.
 */
async function fuentesListas(page: Page): Promise<void> {
  await page.evaluate(async () => {
    await Promise.all(['400', '500', '600', '700'].map((peso) => document.fonts.load(`${peso} 16px "Geist Variable"`)))
    await document.fonts.ready
    // Dos cuadros: el navegador vuelve a medir el texto que dibujó con la fuente de reemplazo.
    await new Promise((listo) => {
      requestAnimationFrame(() => {
        requestAnimationFrame(listo)
      })
    })
  })
}

export async function capturar(page: Page, nombre: string, opciones: Opciones = {}): Promise<void> {
  await expect(page.getByText(/^Cargando/u)).toHaveCount(0)
  await fuentesListas(page)
  if (esMovil()) {
    // En el celular la página no se desplaza de costado (AGENTS.md, «Uso en el celular»).
    const ancho = await page.evaluate(() => document.documentElement.scrollWidth)
    expect.soft(ancho, `${nombre}: la página se desplaza de costado a 390 px`).toBeLessThanOrEqual(390)
  }
  await expect(page).toHaveScreenshot(`${nombre}.png`, {
    fullPage: opciones.fullPage ?? !esMovil(),
    mask: [...volatiles(page), ...(opciones.mask ?? [])],
    stylePath: ESTILO,
    timeout: TIEMPO_CAPTURA,
  })
}

/**
 * La captura de un diálogo o una hoja abierta, solo de la ventana: una
 * máscara sobre el fondo (la hora de un pedido detrás) se pintaría encima
 * del diálogo, porque las máscaras se pintan por encima de cualquier capa.
 */
export async function capturarVentana(ventana: Locator, nombre: string, mask: readonly Locator[] = []): Promise<void> {
  await expect(ventana).toBeVisible()
  await expect(ventana.getByText(/^Cargando/u)).toHaveCount(0)
  await fuentesListas(ventana.page())
  await expect(ventana).toHaveScreenshot(`${nombre}.png`, {
    mask: [...volatiles(ventana), ...mask],
    stylePath: ESTILO,
    timeout: TIEMPO_CAPTURA,
  })
}

/** El tiempo máximo de una captura (ver `TIEMPO_CAPTURA`). */
export const tiempoDeCaptura = TIEMPO_CAPTURA

/**
 * El tiempo de una prueba que junta varias capturas. En WebKit cada captura
 * tarda varias veces lo que en Chromium o Firefox (ver `TIEMPO_CAPTURA`), así
 * que ahí el plazo es mayor.
 */
export function plazo(ms: number): void {
  test.setTimeout(test.info().project.name.includes('webkit') ? ms * 2.5 : ms)
}

/** Si la prueba corre en un proyecto de celular (390 px). */
export function esMovil(): boolean {
  return test.info().project.name.endsWith('-movil')
}
