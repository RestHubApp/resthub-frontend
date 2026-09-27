// Ayudas de las pruebas de gestión (lo que el encargado hace desde la
// laptop): el API sin reusar conexiones, ventas completas para el panel y la
// caja, un restaurante recién dado de alta sin nada cargado y los errores del
// servidor simulados.
import type { APIResponse, Page } from '@playwright/test'

import {
  API_ORIGIN,
  CLAVE_NUEVA,
  entrarPlataformaPorApi,
  entrarPorApi,
  nuevoHttp,
  unico,
  type Local,
  type Mesa,
  type Plato,
  type Sesion,
} from './api'
import { test as base } from './fixtures'

type Json = Record<string, unknown>

const API = `${API_ORIGIN}/api/v1`

async function cuerpo(respuesta: APIResponse, que: string): Promise<Json> {
  if (!respuesta.ok()) {
    throw new Error(`${que}: ${String(respuesta.status())} ${await respuesta.text()}`)
  }
  const texto = await respuesta.text()
  return texto === '' ? {} : (JSON.parse(texto) as Json)
}

type Http = Local['http']

/**
 * El API con el token de una cuenta. Cada llamada abre su conexión: entre dos
 * llamadas la prueba pasa segundos en la pantalla y uvicorn cierra la que
 * quedó abierta, lo que daría «socket hang up» al reusarla.
 */
export class ApiGestion {
  private readonly http: Http
  private readonly token: string

  constructor(http: Http, token: string) {
    this.http = http
    this.token = token
  }

  private opciones(data?: unknown) {
    return { headers: { Authorization: `Bearer ${this.token}`, Connection: 'close' }, data }
  }

  async get(ruta: string): Promise<Json> {
    return cuerpo(await this.http.get(`${API}${ruta}`, this.opciones()), `GET ${ruta}`)
  }

  async lista(ruta: string): Promise<Json[]> {
    const datos = (await this.get(ruta)) as unknown
    return Array.isArray(datos) ? (datos as Json[]) : (((datos as Json).items ?? []) as Json[])
  }

  async post(ruta: string, data: unknown = {}): Promise<Json> {
    return cuerpo(await this.http.post(`${API}${ruta}`, this.opciones(data)), `POST ${ruta}`)
  }

  async put(ruta: string, data: unknown): Promise<Json> {
    return cuerpo(await this.http.put(`${API}${ruta}`, this.opciones(data)), `PUT ${ruta}`)
  }

  async patch(ruta: string, data: unknown): Promise<Json> {
    return cuerpo(await this.http.patch(`${API}${ruta}`, this.opciones(data)), `PATCH ${ruta}`)
  }
}

/** El API como esa cuenta; sin cuenta, como el encargado. */
export function api(local: Pick<Local, 'http' | 'encargado'>, quien: Sesion = local.encargado): ApiGestion {
  return new ApiGestion(local.http, quien.token)
}

/** Un monto como lo escribe la aplicación («S/ 164.00»), con cualquier espacio. */
export function soles(monto: string): RegExp {
  return new RegExp(`S/\\s*${monto.replaceAll('.', '\\.')}`, 'u')
}

/** El día de hoy en Lima, la zona de los restaurantes de prueba (`2026-09-26`). */
export function hoy(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Lima' }).format(new Date())
}

/** El id numérico de una respuesta del API. */
export function id(dato: Json): number {
  return Number(dato.id)
}

export interface Venta {
  readonly items: readonly { readonly plato: Plato; readonly cantidad?: number }[]
  readonly mesa: Mesa
  readonly metodo?: 'cash' | 'yape' | 'plin' | 'card' | 'transfer'
  readonly propina?: string
}

/**
 * Un pedido en mesa de principio a fin, como en el salón: lo toma el mesero,
 * la cocina lo marca listo, el mesero lo sirve y lo cobra. Hace falta la caja
 * abierta. Devuelve el pedido pagado.
 */
export async function vender(local: Local, venta: Venta): Promise<Json> {
  const mesero = api(local, local.mesero)
  const pedido = await mesero.post('/orders', {
    type: 'dine_in',
    table_id: venta.mesa.id,
    client_request_id: `e2e-${unico()}`,
    items: venta.items.map(({ plato, cantidad = 1 }) => ({ menu_item_id: plato.id, quantity: cantidad, notes: '' })),
  })
  const ruta = `/orders/${String(id(pedido))}`
  await mesero.post(`${ruta}/send`)
  await api(local, local.cocina).post(`${ruta}/ready`)
  await mesero.post(`${ruta}/served`)
  return mesero.post(`${ruta}/charge`, { payment_method: venta.metodo ?? 'cash', tip: venta.propina ?? '0' })
}

/** La boleta simple de un pedido pagado, sin datos del cliente. */
export async function emitirBoleta(local: Local, pedidoId: number): Promise<Json> {
  return api(local).post('/billing/invoices', {
    order_id: pedidoId,
    kind: 'boleta',
    customer_name: '',
    customer_document_type: 'none',
    customer_document_number: '',
    customer_address: '',
  })
}

/** Una cuenta más del personal con ese rol. Devuelve la sesión ya iniciada. */
export async function nuevaCuenta(local: Local, nombre: string, rolId: number): Promise<Sesion> {
  const correo = `cuenta-${unico()}@e2e.resthub.dev`
  await api(local).post('/staff', { email: correo, full_name: nombre, role_id: rolId, password: CLAVE_NUEVA })
  return entrarPorApi(local.http, correo, CLAVE_NUEVA)
}

/** Si una cuenta puede entrar con esa contraseña (el código del acceso). */
export async function intentarAcceso(http: Http, email: string, password: string): Promise<number> {
  const respuesta = await http.post(`${API}/auth/login`, { data: { email, password }, headers: { Connection: 'close' } })
  return respuesta.status()
}

/** El servidor responde 500 a cada petición que empiece con esa ruta del API (`/cash/current`). */
export async function fallaServidor(page: Page, ruta: string): Promise<void> {
  await page.route(`**/api/v1${ruta}**`, (peticion) => peticion.fulfill({ status: 500, contentType: 'application/json', body: '{}' }))
}

/** Un restaurante recién dado de alta: solo su encargado, sin carta, mesas ni inventario. */
export interface LocalVacio {
  readonly encargado: Sesion
  readonly http: Http
}

async function crearLocalVacio(): Promise<LocalVacio> {
  const http = await nuevoHttp()
  const plataforma = await entrarPlataformaPorApi(http)
  const sufijo = unico()
  const correo = `vacio-${sufijo}@e2e.resthub.dev`
  await new ApiGestion(http, plataforma.token).post('/platform/restaurants', {
    name: 'Restaurante Vacío E2E',
    slug: `e2e-vacio-${sufijo}`,
    timezone: 'America/Lima',
    owner: { full_name: 'Encargado Nuevo', email: correo, password: CLAVE_NUEVA },
  })
  return { encargado: await entrarPorApi(http, correo, CLAVE_NUEVA), http }
}

/** Los accesorios comunes más el restaurante vacío, para los estados vacíos. */
export const test = base.extend<{ vacio: LocalVacio }>({
  vacio: async ({}, usar) => {
    const vacio = await crearLocalVacio()
    await usar(vacio)
    await vacio.http.dispose()
  },
})

/** Cuenta las veces que la página pide imprimir, sin abrir el diálogo del sistema. */
export async function contarImpresiones(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const ventana = window as unknown as { impresiones: number }
    ventana.impresiones = 0
    window.print = () => {
      ventana.impresiones += 1
    }
  })
}

export async function impresiones(page: Page): Promise<number> {
  return page.evaluate(() => (window as unknown as { impresiones: number }).impresiones)
}

/** El día que cae `dias` después de hoy en Lima (`2026-09-28`). */
export function diaDesdeHoy(dias: number): string {
  const fecha = new Date(`${hoy()}T12:00:00Z`)
  fecha.setUTCDate(fecha.getUTCDate() + dias)
  return fecha.toISOString().slice(0, 10)
}
