// Ayudas de las pruebas de gestión (lo que el encargado hace desde la
// laptop): el API sin reusar conexiones, ventas completas para el panel y la
// caja, un restaurante recién dado de alta sin nada cargado y los errores del
// servidor simulados.
import type { APIResponse, Page } from '@playwright/test'

import {
  API_ORIGIN,
  NEW_SECRET,
  signInPlatformByApi,
  signInByApi,
  newHttp,
  unique,
  type Local,
  type Table,
  type Dish,
  type Session,
} from './api'
import { test as base } from './fixtures'

type Json = Record<string, unknown>

const API = `${API_ORIGIN}/api/v1`

async function body(response: APIResponse, that: string): Promise<Json> {
  if (!response.ok()) {
    throw new Error(`${that}: ${String(response.status())} ${await response.text()}`)
  }
  const text = await response.text()
  return text === '' ? {} : (JSON.parse(text) as Json)
}

type Http = Local['http']

/**
 * El API con el token de una cuenta. Cada llamada abre su conexión: entre dos
 * llamadas la prueba pasa segundos en la pantalla y uvicorn cierra la que
 * quedó abierta, lo que daría «socket hang up» al reusarla.
 */
export class ApiManagement {
  private readonly http: Http
  private readonly token: string

  constructor(http: Http, token: string) {
    this.http = http
    this.token = token
  }

  private opciones(data?: unknown) {
    return { headers: { Authorization: `Bearer ${this.token}`, Connection: 'close' }, data }
  }

  async get(route: string): Promise<Json> {
    return body(await this.http.get(`${API}${route}`, this.opciones()), `GET ${route}`)
  }

  async lista(route: string): Promise<Json[]> {
    const data = (await this.get(route)) as unknown
    return Array.isArray(data) ? (data as Json[]) : (((data as Json).items ?? []) as Json[])
  }

  async post(route: string, data: unknown = {}): Promise<Json> {
    return body(await this.http.post(`${API}${route}`, this.opciones(data)), `POST ${route}`)
  }

  async put(route: string, data: unknown): Promise<Json> {
    return body(await this.http.put(`${API}${route}`, this.opciones(data)), `PUT ${route}`)
  }

  async patch(route: string, data: unknown): Promise<Json> {
    return body(await this.http.patch(`${API}${route}`, this.opciones(data)), `PATCH ${route}`)
  }
}

/** El API como esa cuenta; sin cuenta, como el encargado. */
export function api(local: Pick<Local, 'http' | 'encargado'>, who: Session = local.encargado): ApiManagement {
  return new ApiManagement(local.http, who.token)
}

/** Un monto como lo escribe la aplicación («S/ 164.00»), con cualquier espacio. */
export function soles(amount: string): RegExp {
  // eslint-disable-next-line security/detect-non-literal-regexp -- patrón armado con datos fijos de la propia prueba, sin entradas de usuarios
  return new RegExp(`S/\\s*${amount.replaceAll('.', '\\.')}`, 'u')
}

/** El día de hoy en Lima, la zona de los restaurantes de prueba (`2026-09-26`). */
export function today(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Lima' }).format(new Date())
}

/** El id numérico de una respuesta del API. */
export function id(data: Json): number {
  return Number(data.id)
}

export interface Sale {
  readonly items: readonly { readonly plato: Dish; readonly cantidad?: number }[]
  readonly mesa: Table
  readonly metodo?: 'cash' | 'yape' | 'plin' | 'card' | 'transfer'
  readonly propina?: string
}

/**
 * Un pedido en mesa de principio a fin, como en el salón: lo toma el mesero,
 * la cocina lo marca listo, el mesero lo sirve y lo cobra. Hace falta la caja
 * abierta. Devuelve el pedido pagado.
 */
export async function sell(local: Local, sale: Sale): Promise<Json> {
  const waiter = api(local, local.mesero)
  const order = await waiter.post('/orders', {
    type: 'dine_in',
    table_id: sale.mesa.id,
    client_request_id: `e2e-${unique()}`,
    items: sale.items.map(({ plato: dish, cantidad: quantity = 1 }) => ({ menu_item_id: dish.id, quantity: quantity, notes: '' })),
  })
  const route = `/orders/${String(id(order))}`
  await waiter.post(`${route}/send`)
  await api(local, local.cocina).post(`${route}/ready`)
  await waiter.post(`${route}/served`)
  return waiter.post(`${route}/charge`, { payment_method: sale.metodo ?? 'cash', tip: sale.propina ?? '0' })
}

/** La boleta simple de un pedido pagado, sin datos del cliente. */
export async function issueSalesReceipt(local: Local, orderId: number): Promise<Json> {
  return api(local).post('/billing/invoices', {
    order_id: orderId,
    kind: 'boleta',
    customer_name: '',
    customer_document_type: 'none',
    customer_document_number: '',
    customer_address: '',
  })
}

/** Una cuenta más del personal con ese rol. Devuelve la sesión ya iniciada. */
export async function newAccount(local: Local, name: string, roleId: number): Promise<Session> {
  const email = `cuenta-${unique()}@e2e.resthub.dev`
  await api(local).post('/staff', { email: email, full_name: name, role_id: roleId, password: NEW_SECRET })
  return signInByApi(local.http, email, NEW_SECRET)
}

/** Si una cuenta puede entrar con esa contraseña (el código del acceso). */
export async function tryAccess(http: Http, email: string, password: string): Promise<number> {
  const response = await http.post(`${API}/auth/login`, { data: { email, password }, headers: { Connection: 'close' } })
  return response.status()
}

/** El servidor responde 500 a cada petición que empiece con esa ruta del API (`/cash/current`). */
export async function failureServer(page: Page, route: string): Promise<void> {
  await page.route(`**/api/v1${route}**`, (request) => request.fulfill({ status: 500, contentType: 'application/json', body: '{}' }))
}

/** Un restaurante recién dado de alta: solo su encargado, sin carta, mesas ni inventario. */
export interface RestaurantEmpty {
  readonly encargado: Session
  readonly http: Http
}

async function createRestaurantEmpty(): Promise<RestaurantEmpty> {
  const http = await newHttp()
  const platform = await signInPlatformByApi(http)
  const suffix = unique()
  const email = `vacio-${suffix}@e2e.resthub.dev`
  await new ApiManagement(http, platform.token).post('/platform/restaurants', {
    name: 'Restaurante Vacío E2E',
    slug: `e2e-vacio-${suffix}`,
    timezone: 'America/Lima',
    owner: { full_name: 'Encargado Nuevo', email: email, password: NEW_SECRET },
  })
  return { encargado: await signInByApi(http, email, NEW_SECRET), http }
}

/** Los accesorios comunes más el restaurante vacío, para los estados vacíos. */
export const test = base.extend<{ vacio: RestaurantEmpty }>({
  vacio: async ({}, use) => {
    const empty = await createRestaurantEmpty()
    await use(empty)
    await empty.http.dispose()
  },
})

/** Cuenta las veces que la página pide imprimir, sin abrir el diálogo del sistema. */
export async function countPrints(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const windowValue = window as unknown as { impresiones: number }
    windowValue.impresiones = 0
    window.print = () => {
      windowValue.impresiones += 1
    }
  })
}

export async function prints(page: Page): Promise<number> {
  return page.evaluate(() => (window as unknown as { impresiones: number }).impresiones)
}

/** El día que cae `dias` después de hoy en Lima (`2026-09-28`). */
export function dayFromToday(days: number): string {
  const date = new Date(`${today()}T12:00:00Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}
