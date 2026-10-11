import { chromium, devices, type Browser, type Page } from '@playwright/test'

import { unique, type Resource } from './resources.ts'
import type { Route } from './routes.ts'
import { needsSession, signInWaiter } from './session.ts'

/** El celular del mesero: la visita que más pesa en el consumo de datos. */
const PHONE = { ...devices['Pixel 7'], viewport: { width: 390, height: 844 } }

interface BrowserVisit {
  readonly browser: Browser
  /** La dirección del servidor, sin barra final. */
  readonly base: string
  readonly route: Route
  /** Cuánto se espera después de `load` por lo que la aplicación carga más tarde. */
  readonly settleMs: number
}

// Los datos de la sesión de prueba no se cuentan: no son de la aplicación.
function isApiCall(url: URL): boolean {
  return url.pathname.startsWith('/api/')
}

// Cada petición terminada se mide en cuanto llega; `pending` espera a todas.
function collect(page: Page, found: Resource[], pending: Promise<void>[]): void {
  page.on('requestfinished', (request) => {
    pending.push(
      request.sizes().then((sizes) => {
        const url = new URL(request.url())
        if (!isApiCall(url)) {
          found.push({
            url: url.pathname.replace(/^\//u, '') || 'index.html',
            bytes: sizes.responseBodySize + sizes.responseHeadersSize,
            origin: 'page',
          })
        }
      }),
    )
  })
}

/**
 * La primera visita de una ruta en Chromium: un contexto nuevo (sin caché ni
 * almacenamiento), el service worker bloqueado y los bytes que de verdad
 * viajaron (cuerpo comprimido más cabeceras), incluidos los de lo que se carga
 * unos segundos después de `load`.
 */
export async function browserVisit({ browser, base, route, settleMs }: BrowserVisit): Promise<Resource[]> {
  const context = await browser.newContext({ ...PHONE, serviceWorkers: 'block', locale: 'es-PE' })
  try {
    if (needsSession(route)) {
      await signInWaiter(context)
    }
    const page = await context.newPage()
    const found: Resource[] = []
    const pending: Promise<void>[] = []
    collect(page, found, pending)
    await page.goto(`${base}${route.path}`, { waitUntil: 'load' })
    await page.waitForTimeout(settleMs)
    await Promise.all(pending)
    return unique(found)
  } finally {
    await context.close()
  }
}

export function launchChromium(): Promise<Browser> {
  return chromium.launch()
}
