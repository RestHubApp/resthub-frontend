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

import { expect as expectBase, test as base } from '../support/fixtures'
import { LOG, SAMPLE_RESTAURANT, OBSERVABILITY, RESTAURANTS } from './data'


const STYLE = join(import.meta.dirname, 'captura.css')
// Tomar una captura en WebKit bajo WSL (sin GPU, con el envoltorio de
// librerías) tarda varios segundos, más con otras pruebas corriendo: con los
// 8 s de `expect` la primera ni siquiera termina. Es el tiempo de sacar la
// foto, no una espera a que algo se estabilice.
const TIME_CAPTURE = 30_000

/**
 * El `expect` de las capturas, con 15 s para que aparezca cada cosa en vez
 * de 8. El backend de prueba es uno solo para las cuatro suites que corren a
 * la vez: en los picos una lista (las recetas, las reservas) tardó más de 8 s
 * en llegar y la pantalla seguía en «Cargando…». No cambia qué se espera.
 */
export const expect = expectBase.configure({ timeout: 15_000 })
const API = '/api/v1'
const EVENTS = `${API}/events`
const OBS = `${API}/platform/observability/`

const FIXED: Readonly<Record<string, unknown>> = {
  [`${API}/platform/restaurants`]: RESTAURANTS,
  [`${API}/platform/activity`]: LOG,
  [`${API}/platform/sandbox`]: SAMPLE_RESTAURANT,
}

/** Los sufijos aleatorios de las cuentas y los locales de prueba, con su reemplazo fijo. */
const SUFFIXES: readonly (readonly [RegExp, string])[] = [
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
const LISTS_WITH_HOUR: readonly RegExp[] = [
  /^\/api\/v1\/orders$/u,
  /^\/api\/v1\/inventory\/movements$/u,
  // eslint-disable-next-line security/detect-unsafe-regex -- se aplica a textos cortos de la interfaz o del API de prueba, sin entradas externas
  /^\/api\/v1\/cash\/sessions(?:\/\d+)?$/u,
  // eslint-disable-next-line security/detect-unsafe-regex -- se aplica a textos cortos de la interfaz o del API de prueba, sin entradas externas
  /^\/api\/v1\/billing\/invoices(?:\/\d+)?$/u,
  /^\/api\/v1\/billing\/orders\/\d+\/invoice$/u,
  // eslint-disable-next-line security/detect-unsafe-regex -- se aplica a textos cortos de la interfaz o del API de prueba, sin entradas externas
  /^\/api\/v1\/customers(?:\/\d+)?$/u,
]
// eslint-disable-next-line security/detect-unsafe-regex -- se aplica a textos cortos de la interfaz o del API de prueba, sin entradas externas
const INSTANT = /"(\d{4}-\d{2}-\d{2})T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})"/gu

// La ficha de un restaurante de plataforma muestra «Alta: <fecha y hora>»: el
// largo de ese texto (enmascarado) cambia con la hora y hacía saltar de línea
// lo que sigue. Se fija el instante entero (la ficha no calcula tiempos).
const CARD_WITH_REGISTRATION = /^\/api\/v1\/platform\/restaurants\/\d+$/u

function normalize(route: string, text: string): string {
  const withoutSuffixes = SUFFIXES.reduce((actual, [pattern, replacement]) => actual.replace(pattern, replacement), text)
  if (CARD_WITH_REGISTRATION.test(route)) {
    return withoutSuffixes.replace(INSTANT, '"2026-09-27T17:00:00Z"')
  }
  return LISTS_WITH_HOUR.some((list) => list.test(route)) ? withoutSuffixes.replace(INSTANT, '"$1T17:00:00Z"') : withoutSuffixes
}

function fixedData(route: string): unknown {
  if (route.startsWith(OBS)) {
    const password = route.slice(OBS.length) as keyof typeof OBSERVABILITY
    return OBSERVABILITY[password]
  }
  return FIXED[route]
}

async function respond(route: Route, request: Request): Promise<void> {
  if (request.method() !== 'GET') {
    await route.fallback()
    return
  }
  const routeValue = new URL(request.url()).pathname
  const fixed = fixedData(routeValue)
  if (fixed !== undefined) {
    await route.fulfill({ json: fixed })
    return
  }
  // Sin reusar la conexión: uvicorn cierra las que quedan abiertas a los 5 s
  // y reusarla da «socket hang up» (igual que en `e2e/support/api.ts`). Si
  // aun así se corta, se intenta una vez más.
  const options = { headers: { ...request.headers(), connection: 'close' } }
  const response = await route.fetch(options).catch(async () => route.fetch(options))
  await route.fulfill({ response: response, body: normalize(routeValue, await response.text()) })
}

function esApi(url: URL): boolean {
  return url.pathname.startsWith(`${API}/`) && url.pathname !== EVENTS
}

async function prepare(page: Page): Promise<void> {
  await page.route('https://cdn.jsdelivr.net/**', (route) => route.abort())
  // El widget de accesibilidad, al iniciarse, fija en línea el tamaño de letra
  // de cada texto ya dibujado con `parseInt` (12,8 px pasa a 12 px) y no toca
  // lo que se dibuja después: según cuándo termina de bajar, el mismo enlace
  // salía de 12 o de 12,8 px. Las capturas se toman sin el widget; su menú lo
  // recorren las E2E (ACC-13 y ACC-14).
  await page.route(/\/assets\/sienna-accessibility[^/]*\.js$/u, (route) => route.abort())
  await page.route(esApi, async (route, request) => {
    // Si `route.fetch` falla (el servidor cortó la conexión) la petición no
    // puede quedar sin respuesta: la página seguiría en «Cargando…». Sigue
    // sin normalizar hacia el servidor. Si la página ya se cerró, no hay a
    // quién responder.
    await respond(route, request).catch(async () => route.continue().catch(() => undefined))
  })
}

/** Los accesorios de siempre, con la página ya preparada para capturar. */
export const test = base.extend<{ capturable: undefined }>({
  capturable: [
    async ({ page }, use) => {
      await prepare(page)
      await use(undefined)
      await page.unrouteAll({ behavior: 'ignoreErrors' })
    },
    { auto: true },
  ],
})

const MONTHS = 'ene|feb|mar|abr|may|jun|jul|ago|set|oct|nov|dic'
const MONTHS_LONGS = 'enero|febrero|marzo|abril|mayo|junio|julio|agosto|setiembre|octubre|noviembre|diciembre'

/** Lo que cambia con la hora real: fechas, horas, minutos transcurridos y cuentas regresivas. */
export function volatiles(page: Page | Locator): Locator[] {
  return [
    page.getByText(/\d{1,2}:\d{2}\s?[ap]\.\s?m\./u),
    page.getByText(new RegExp(`\\b\\d{1,2} (?:${MONTHS})\\.?(?: \\d{4})?\\b`, 'u')),
    page.getByText(new RegExp(`\\d{1,2} de (?:${MONTHS_LONGS})`, 'u')),
    page.getByText(/^\d+ min$/u),
    page.getByText(/^hace /u),
    page.getByRole('timer'),
  ]
}

export interface Options {
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
async function sourcesLists(page: Page): Promise<void> {
  await page.evaluate(async () => {
    await Promise.all(['400', '500', '600', '700'].map((weight) => document.fonts.load(`${weight} 16px "Geist Variable"`)))
    await document.fonts.ready
    // Dos cuadros: el navegador vuelve a medir el texto que dibujó con la fuente de reemplazo.
    await new Promise((ready) => {
      requestAnimationFrame(() => {
        requestAnimationFrame(ready)
      })
    })
  })
}

export async function capture(page: Page, name: string, options: Options = {}): Promise<void> {
  await expect(page.getByText(/^Cargando/u)).toHaveCount(0)
  await sourcesLists(page)
  if (isMobile()) {
    // En el celular la página no se desplaza de costado (AGENTS.md, «Uso en el celular»).
    const width = await page.evaluate(() => document.documentElement.scrollWidth)
    expect.soft(width, `${name}: la página se desplaza de costado a 390 px`).toBeLessThanOrEqual(390)
  }
  await expect(page).toHaveScreenshot(`${name}.png`, {
    fullPage: options.fullPage ?? !isMobile(),
    mask: [...volatiles(page), ...(options.mask ?? [])],
    stylePath: STYLE,
    timeout: TIME_CAPTURE,
  })
}

/**
 * La captura de un diálogo o una hoja abierta, solo de la ventana: una
 * máscara sobre el fondo (la hora de un pedido detrás) se pintaría encima
 * del diálogo, porque las máscaras se pintan por encima de cualquier capa.
 */
export async function captureWindow(windowValue: Locator, name: string, mask: readonly Locator[] = []): Promise<void> {
  await expect(windowValue).toBeVisible()
  await expect(windowValue.getByText(/^Cargando/u)).toHaveCount(0)
  await sourcesLists(windowValue.page())
  await expect(windowValue).toHaveScreenshot(`${name}.png`, {
    mask: [...volatiles(windowValue), ...mask],
    stylePath: STYLE,
    timeout: TIME_CAPTURE,
  })
}

/** El tiempo máximo de una captura (ver `TIEMPO_CAPTURA`). */
export const captureTime = TIME_CAPTURE

/**
 * El tiempo de una prueba que junta varias capturas. En WebKit cada captura
 * tarda varias veces lo que en Chromium o Firefox (ver `TIEMPO_CAPTURA`), así
 * que ahí el plazo es mayor.
 */
export function deadline(ms: number): void {
  test.setTimeout(test.info().project.name.includes('webkit') ? ms * 2.5 : ms)
}

/** Si la prueba corre en un proyecto de celular (390 px). */
export function isMobile(): boolean {
  return test.info().project.name.endsWith('-mobile')
}
