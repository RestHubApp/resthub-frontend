// RNFP-13: sin rastreadores. La aplicación solo habla con su propio origen y
// con el API; ninguna pantalla carga analítica, píxeles, fuentes ni scripts de
// terceros. Si alguien agrega uno, esta prueba falla y dice a qué dirección fue.
import type { Page } from '@playwright/test'

import { API_ORIGIN } from '../support/api'
import { openAs, expect, test } from '../support/fixtures'

// Lo que el navegador resuelve sin salir a la red.
const LOCAL_SCHEMES = new Set(['data:', 'blob:', 'about:'])

/** Anota cada petición que sale de la página a un origen que no es el propio ni el del API. */
function watchForeignRequests(page: Page, baseUrl: string): string[] {
  const allowed = new Set([new URL(baseUrl).origin, new URL(API_ORIGIN).origin])
  const foreign: string[] = []
  page.on('request', (request) => {
    const url = new URL(request.url())
    if (!LOCAL_SCHEMES.has(url.protocol) && !allowed.has(url.origin)) {
      foreign.push(request.url())
    }
  })
  return foreign
}

/**
 * Espera a que la pantalla termine de cargar. No sirve `networkidle`: con sesión,
 * el canal de avisos (SSE) mantiene una conexión abierta mientras dure la sesión.
 */
async function settle(page: Page): Promise<void> {
  await page.waitForLoadState('load')
  await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible()
}

async function visit(page: Page, destination: string): Promise<void> {
  await page.goto(destination)
  await settle(page)
}

test.beforeEach(() => {
  test.slow()
})

test('PRIV-01 sin sesión, el acceso, la privacidad y los términos no llaman a terceros @mobile', async ({ page, baseURL }) => {
  const foreign = watchForeignRequests(page, baseURL ?? '')
  for (const destination of ['/acceso', '/privacidad', '/terminos']) {
    await visit(page, destination)
  }
  expect(foreign).toEqual([])
})

test('PRIV-02 con sesión, el mesero y el encargado no llaman a terceros @mobile', async ({ page, baseURL, local }) => {
  const foreign = watchForeignRequests(page, baseURL ?? '')
  await openAs(page, local.waiter, '/pedidos')
  await settle(page)
  await openAs(page, local.owner, '/panel')
  await settle(page)
  for (const destination of ['/clientes', '/caja', '/perfil']) {
    await visit(page, destination)
  }
  expect(foreign).toEqual([])
})
