// Ayudas de las pruebas de acceso, armazón y administración del sistema.
//
// El local de muestra de la vista previa es uno solo para el backend entero:
// reiniciarlo archiva el vigente y deja sin acceso a la vista previa que esté
// abierta. Las pruebas de esta carpeta que lo usan toman antes un candado
// entre procesos (una carpeta que se crea de forma atómica), así un reinicio
// de una repetición no corta la vista previa que abre otra.
import { mkdirSync, rmSync, statSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import type { APIRequestContext, Page } from '@playwright/test'

import {
  API_ORIGIN,
  NEW_SECRET,
  type Customer,
  signInPlatformByApi,
  type Table,
  type Dish,
  type Session,
  unique,
} from './api'
import { expect } from './fixtures'

// Lo que muestra cada página de las listas de plataforma (`PLATFORM_PAGE_SIZE`).
export const PAGE_PLATFORM = 25

const LOCK = join(tmpdir(), 'resthub-e2e-local-de-muestra.lock')
// Un candado más viejo que esto quedó de una corrida que se cortó.
const EXPIRED_LOCK_MS = 120_000
const WAIT_LOCK_MS = 150_000

function takeLock(): boolean {
  try {
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- ruta armada con constantes del repositorio de pruebas, sin entradas de usuarios
    mkdirSync(LOCK)
    return true
  } catch {
    try {
      // eslint-disable-next-line security/detect-non-literal-fs-filename -- ruta armada con constantes del repositorio de pruebas, sin entradas de usuarios
      if (Date.now() - statSync(LOCK).mtimeMs > EXPIRED_LOCK_MS) {
        rmSync(LOCK, { recursive: true, force: true })
      }
    } catch {
      // Otro proceso lo soltó mientras tanto: se vuelve a intentar.
    }
    return false
  }
}

/** Corre `uso` con el local de muestra para esta prueba sola. */
export async function withSampleRestaurant(usage: () => Promise<void>): Promise<void> {
  await expect.poll(takeLock, { timeout: WAIT_LOCK_MS, intervals: [250] }).toBe(true)
  try {
    await usage()
  } finally {
    rmSync(LOCK, { recursive: true, force: true })
  }
}

/** Entra por el formulario de acceso del personal. */
export async function signInByForm(page: Page, email: string, password: string): Promise<void> {
  await page.getByLabel('Correo').fill(email)
  await page.getByLabel('Contraseña', { exact: true }).fill(password)
  await page.getByRole('button', { name: 'Entrar' }).click()
}

/** La navegación principal que se ve: la barra lateral en escritorio o la inferior en el celular. */
export function navigation(page: Page) {
  return page.getByRole('navigation', { name: 'Navegación principal' })
}

/** Los rótulos de los enlaces de la navegación que se ve, en orden. */
export async function sections(page: Page): Promise<string[]> {
  const links = await navigation(page).getByRole('link').allInnerTexts()
  return links.map((text) => text.trim())
}

const QUEUE = 'resthub.pedidos-sin-enviar.v2'

export interface OrderInQueue {
  readonly table: Pick<Table, 'id' | 'label'>
  readonly dish: Pick<Dish, 'id'>
}

/**
 * Deja pedidos en la cola sin señal del navegador (o de la pestaña, en una
 * vista previa), con el formato de `src/store/offlineQueue.ts`, a nombre de la
 * cuenta indicada. La página tiene que estar en la aplicación.
 */
export async function enqueueOrders(
  page: Page,
  account: { readonly userId: number; readonly restaurantId: number },
  orders: readonly OrderInQueue[],
  storage: 'local' | 'pestana' = 'local',
): Promise<void> {
  const queue = orders.map(({ table, dish }) => ({
    userId: account.userId,
    restaurantId: account.restaurantId,
    queuedAt: new Date().toISOString(),
    label: `Mesa ${table.label}`,
    request: {
      type: 'dine_in',
      table_id: table.id,
      client_request_id: `e2e-cola-${unique()}`,
      items: [{ menu_item_id: dish.id, quantity: 1, notes: '' }],
    },
  }))
  await page.evaluate(
    ([password, value, where]) => {
      const destination = where === 'local' ? localStorage : sessionStorage
      destination.setItem(password, value)
    },
    [QUEUE, JSON.stringify(queue), storage] as const,
  )
}

/** La dueña de los pedidos en cola de una sesión del API. */
export function ownerOf(session: Session): { userId: number; restaurantId: number } {
  const { user, restaurant } = session.account as { user: { id: number }; restaurant: { id: number } }
  return { userId: user.id, restaurantId: restaurant.id }
}

/** Lo que quedó en la cola sin señal del navegador. */
export async function savedQueue(page: Page): Promise<number> {
  return page.evaluate((password) => {
    const raw = localStorage.getItem(password)
    return raw === null ? 0 : (JSON.parse(raw) as unknown[]).length
  }, QUEUE)
}

/**
 * Que el envío de pedidos no llegue al servidor, como sin señal: así la cola
 * no se vacía sola mientras la prueba mira el aviso.
 */
export async function withoutOrdersSending(page: Page): Promise<void> {
  await page.route('**/api/v1/orders', async (route) => {
    if (route.request().method() === 'POST') {
      await route.abort('internetdisconnected')
      return
    }
    await route.continue()
  })
}

/**
 * Un código de vista previa que el servidor rechaza, para llenar los logs de
 * advertencias (`auth.preview_rejected`). No cuesta como un acceso fallido: no
 * compara contraseñas ni toca el límite de intentos de ninguna cuenta.
 */
export async function previewWarnings(howMany: number): Promise<void> {
  const url = `${API_ORIGIN}/api/v1/auth/preview`
  const batch = Array.from({ length: howMany }, () =>
    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: `codigo-falso-${unique()}` }),
    }),
  )
  const responses = await Promise.all(batch)
  expect(responses.every((response) => response.status === 401)).toBe(true)
}

function restaurantRegistration(platform: Customer, name: string) {
  const suffix = unique()
  return platform.post('/platform/restaurants', {
    name,
    slug: `e2e-pag-${suffix}`,
    timezone: 'America/Lima',
    owner: { full_name: 'Encargada Prueba', email: `pag-${suffix}@e2e.resthub.dev`, password: NEW_SECRET },
  })
}

/**
 * Da de alta `cuantos` restaurantes con el mismo prefijo, de a uno: el alta
 * compara contraseñas y escribe en la base, y muchas a la vez la ahogan.
 */
export async function restaurantsWithPrefix(platform: Customer, prefix: string, howMany: number): Promise<void> {
  for (let index = 1; index <= howMany; index += 1) {
    await restaurantRegistration(platform, `${prefix} ${String(index).padStart(2, '0')}`)
  }
}

/** Que la lista de restaurantes tenga más de una página. Solo da de alta los que falten. */
export async function restaurantsWithPages(platform: Customer): Promise<void> {
  let total = Number((await platform.get('/platform/restaurants?limit=1&offset=0')).total)
  while (total <= PAGE_PLATFORM) {
    await restaurantRegistration(platform, `Relleno ${unique()}`)
    total += 1
  }
}

/** Que la bitácora de plataforma tenga más de una página: cada acceso deja una entrada. */
export async function logWithPages(http: APIRequestContext, platform: Customer): Promise<number> {
  let total = Number((await platform.get('/platform/activity?limit=1&offset=0')).total)
  while (total <= PAGE_PLATFORM) {
    await signInPlatformByApi(http)
    total = Number((await platform.get('/platform/activity?limit=1&offset=0')).total)
  }
  return total
}
