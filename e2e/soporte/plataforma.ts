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
  CLAVE_NUEVA,
  type Cliente,
  entrarPlataformaPorApi,
  type Mesa,
  type Plato,
  type Sesion,
  unico,
} from './api'
import { expect } from './fixtures'

// Lo que muestra cada página de las listas de plataforma (`PLATFORM_PAGE_SIZE`).
export const PAGINA_PLATAFORMA = 25

const CANDADO = join(tmpdir(), 'resthub-e2e-local-de-muestra.lock')
// Un candado más viejo que esto quedó de una corrida que se cortó.
const CANDADO_VENCIDO_MS = 120_000
const ESPERA_CANDADO_MS = 150_000

function tomarCandado(): boolean {
  try {
    mkdirSync(CANDADO)
    return true
  } catch {
    try {
      if (Date.now() - statSync(CANDADO).mtimeMs > CANDADO_VENCIDO_MS) {
        rmSync(CANDADO, { recursive: true, force: true })
      }
    } catch {
      // Otro proceso lo soltó mientras tanto: se vuelve a intentar.
    }
    return false
  }
}

/** Corre `uso` con el local de muestra para esta prueba sola. */
export async function conLocalDeMuestra(uso: () => Promise<void>): Promise<void> {
  await expect.poll(tomarCandado, { timeout: ESPERA_CANDADO_MS, intervals: [250] }).toBe(true)
  try {
    await uso()
  } finally {
    rmSync(CANDADO, { recursive: true, force: true })
  }
}

/** Entra por el formulario de acceso del personal. */
export async function entrarPorFormulario(page: Page, email: string, password: string): Promise<void> {
  await page.getByLabel('Correo').fill(email)
  await page.getByLabel('Contraseña', { exact: true }).fill(password)
  await page.getByRole('button', { name: 'Entrar' }).click()
}

/** La navegación principal que se ve: la barra lateral en escritorio o la inferior en el celular. */
export function navegacion(page: Page) {
  return page.getByRole('navigation', { name: 'Navegación principal' })
}

/** Los rótulos de los enlaces de la navegación que se ve, en orden. */
export async function secciones(page: Page): Promise<string[]> {
  const enlaces = await navegacion(page).getByRole('link').allInnerTexts()
  return enlaces.map((texto) => texto.trim())
}

const COLA = 'resthub.pedidos-sin-enviar.v2'

export interface PedidoEnCola {
  readonly mesa: Pick<Mesa, 'id' | 'etiqueta'>
  readonly plato: Pick<Plato, 'id'>
}

/**
 * Deja pedidos en la cola sin señal del navegador (o de la pestaña, en una
 * vista previa), con el formato de `src/store/offlineQueue.ts`, a nombre de la
 * cuenta indicada. La página tiene que estar en la aplicación.
 */
export async function encolarPedidos(
  page: Page,
  cuenta: { readonly userId: number; readonly restaurantId: number },
  pedidos: readonly PedidoEnCola[],
  almacen: 'local' | 'pestana' = 'local',
): Promise<void> {
  const cola = pedidos.map(({ mesa, plato }) => ({
    userId: cuenta.userId,
    restaurantId: cuenta.restaurantId,
    queuedAt: new Date().toISOString(),
    label: `Mesa ${mesa.etiqueta}`,
    request: {
      type: 'dine_in',
      table_id: mesa.id,
      client_request_id: `e2e-cola-${unico()}`,
      items: [{ menu_item_id: plato.id, quantity: 1, notes: '' }],
    },
  }))
  await page.evaluate(
    ([clave, valor, donde]) => {
      const destino = donde === 'local' ? localStorage : sessionStorage
      destino.setItem(clave, valor)
    },
    [COLA, JSON.stringify(cola), almacen] as const,
  )
}

/** La dueña de los pedidos en cola de una sesión del API. */
export function duenaDe(sesion: Sesion): { userId: number; restaurantId: number } {
  const { user, restaurant } = sesion.cuenta as { user: { id: number }; restaurant: { id: number } }
  return { userId: user.id, restaurantId: restaurant.id }
}

/** Lo que quedó en la cola sin señal del navegador. */
export async function colaGuardada(page: Page): Promise<number> {
  return page.evaluate((clave) => {
    const crudo = localStorage.getItem(clave)
    return crudo === null ? 0 : (JSON.parse(crudo) as unknown[]).length
  }, COLA)
}

/**
 * Que el envío de pedidos no llegue al servidor, como sin señal: así la cola
 * no se vacía sola mientras la prueba mira el aviso.
 */
export async function sinEnvioDePedidos(page: Page): Promise<void> {
  await page.route('**/api/v1/orders', async (ruta) => {
    if (ruta.request().method() === 'POST') {
      await ruta.abort('internetdisconnected')
      return
    }
    await ruta.continue()
  })
}

/**
 * Un código de vista previa que el servidor rechaza, para llenar los logs de
 * advertencias (`auth.preview_rejected`). No cuesta como un acceso fallido: no
 * compara contraseñas ni toca el límite de intentos de ninguna cuenta.
 */
export async function advertenciasDeVistaPrevia(cuantas: number): Promise<void> {
  const url = `${API_ORIGIN}/api/v1/auth/preview`
  const lote = Array.from({ length: cuantas }, () =>
    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: `codigo-falso-${unico()}` }),
    }),
  )
  const respuestas = await Promise.all(lote)
  expect(respuestas.every((respuesta) => respuesta.status === 401)).toBe(true)
}

function altaDeRestaurante(plataforma: Cliente, nombre: string) {
  const sufijo = unico()
  return plataforma.post('/platform/restaurants', {
    name: nombre,
    slug: `e2e-pag-${sufijo}`,
    timezone: 'America/Lima',
    owner: { full_name: 'Encargada Prueba', email: `pag-${sufijo}@e2e.resthub.dev`, password: CLAVE_NUEVA },
  })
}

/**
 * Da de alta `cuantos` restaurantes con el mismo prefijo, de a uno: el alta
 * compara contraseñas y escribe en la base, y muchas a la vez la ahogan.
 */
export async function restaurantesConPrefijo(plataforma: Cliente, prefijo: string, cuantos: number): Promise<void> {
  for (let indice = 1; indice <= cuantos; indice += 1) {
    await altaDeRestaurante(plataforma, `${prefijo} ${String(indice).padStart(2, '0')}`)
  }
}

/** Que la lista de restaurantes tenga más de una página. Solo da de alta los que falten. */
export async function restaurantesConPaginas(plataforma: Cliente): Promise<void> {
  let total = Number((await plataforma.get('/platform/restaurants?limit=1&offset=0')).total)
  while (total <= PAGINA_PLATAFORMA) {
    await altaDeRestaurante(plataforma, `Relleno ${unico()}`)
    total += 1
  }
}

/** Que la bitácora de plataforma tenga más de una página: cada acceso deja una entrada. */
export async function bitacoraConPaginas(http: APIRequestContext, plataforma: Cliente): Promise<number> {
  let total = Number((await plataforma.get('/platform/activity?limit=1&offset=0')).total)
  while (total <= PAGINA_PLATAFORMA) {
    await entrarPlataformaPorApi(http)
    total = Number((await plataforma.get('/platform/activity?limit=1&offset=0')).total)
  }
  return total
}
