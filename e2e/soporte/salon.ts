// Ayudas de las pruebas del salón: pedidos preparados por el API, platos con
// opciones y la impresión del navegador reemplazada por un contador.
import type { APIResponse, Page } from '@playwright/test'

import { API_ORIGIN, unico, type Local, type Mesa, type Plato, type Sesion } from './api'

type Json = Record<string, unknown>

const API = `${API_ORIGIN}/api/v1`

async function cuerpo(respuesta: APIResponse, que: string): Promise<Json> {
  if (!respuesta.ok()) {
    throw new Error(`${que}: ${String(respuesta.status())} ${await respuesta.text()}`)
  }
  const texto = await respuesta.text()
  return texto === '' ? {} : (JSON.parse(texto) as Json)
}

/**
 * El API con el token de una cuenta, sin reusar la conexión.
 *
 * Entre dos llamadas una prueba pasa varios segundos en la pantalla; para
 * entonces uvicorn ya cerró la conexión que quedó abierta (a los 5 s) y
 * reusarla da «socket hang up». Cada llamada abre la suya.
 */
export class ApiSalon {
  private readonly local: Local
  private readonly token: string

  constructor(local: Local, quien: Sesion) {
    this.local = local
    this.token = quien.token
  }

  private opciones(data?: unknown) {
    return { headers: { Authorization: `Bearer ${this.token}`, Connection: 'close' }, data }
  }

  async get(ruta: string): Promise<Json> {
    return cuerpo(await this.local.http.get(`${API}${ruta}`, this.opciones()), `GET ${ruta}`)
  }

  /** Solo el código de estado, para comprobar un 404 o un rechazo. */
  async estado(ruta: string): Promise<number> {
    return (await this.local.http.get(`${API}${ruta}`, this.opciones())).status()
  }

  async lista(ruta: string): Promise<Json[]> {
    const datos = (await this.get(ruta)) as unknown
    return Array.isArray(datos) ? (datos as Json[]) : (((datos as Json).items ?? []) as Json[])
  }

  async post(ruta: string, data: unknown = {}): Promise<Json> {
    return cuerpo(await this.local.http.post(`${API}${ruta}`, this.opciones(data)), `POST ${ruta}`)
  }

  async patch(ruta: string, data: unknown): Promise<Json> {
    return cuerpo(await this.local.http.patch(`${API}${ruta}`, this.opciones(data)), `PATCH ${ruta}`)
  }
}

/** El API como esa cuenta; sin cuenta, como el encargado. */
export function api(local: Local, quien: Sesion = local.encargado): ApiSalon {
  return new ApiSalon(local, quien)
}

export interface Linea {
  readonly plato: Plato
  readonly cantidad?: number
  readonly notas?: string
  /** Las opciones elegidas de un plato con `modifier_groups`. */
  readonly opciones?: readonly { readonly grupo: string; readonly opcion: string }[]
}

function items(lineas: readonly Linea[]) {
  return lineas.map(({ plato, cantidad = 1, notas = '', opciones = [] }) => ({
    menu_item_id: plato.id,
    quantity: cantidad,
    notes: notas,
    modifiers: opciones.map(({ grupo, opcion }) => ({ group: grupo, option: opcion })),
  }))
}

/** El número y el id de un pedido que devolvió el API. */
export function numero(pedido: Json): string {
  return String(pedido.number)
}

export function id(pedido: Json): number {
  return Number(pedido.id)
}

/** Un pedido en mesa abierto que todavía no se envió a cocina. */
export async function pedidoAbierto(local: Local, mesa: Mesa, lineas: readonly Linea[]): Promise<Json> {
  return api(local, local.mesero).post('/orders', {
    type: 'dine_in',
    table_id: mesa.id,
    client_request_id: `e2e-${unico()}`,
    items: items(lineas),
  })
}

/** Un pedido para llevar enviado a cocina. */
export async function pedidoParaLlevar(
  local: Local,
  nombre: string,
  lineas: readonly Linea[],
  quien: Sesion = local.mesero,
): Promise<Json> {
  const llevar = api(local, quien)
  const pedido = await llevar.post('/orders', {
    type: 'takeaway',
    customer_name: nombre,
    client_request_id: `e2e-${unico()}`,
    items: items(lineas),
  })
  return llevar.post(`/orders/${String(pedido.id)}/send`)
}

/** Un delivery enviado a cocina. */
export async function pedidoDelivery(local: Local, cliente: string, lineas: readonly Linea[]): Promise<Json> {
  const mesero = api(local, local.mesero)
  const pedido = await mesero.post('/orders', {
    type: 'delivery',
    customer_name: cliente,
    customer_phone: '987654321',
    delivery_address: 'Av. Arequipa 123, Lince',
    delivery_reference: 'Frente al parque',
    client_request_id: `e2e-${unico()}`,
    items: items(lineas),
  })
  return mesero.post(`/orders/${String(pedido.id)}/send`)
}

/** Un pedido en mesa abierto y enviado a cocina, como el celular del mesero. */
export async function pedidoEnMesa(
  local: Local,
  mesa: Mesa,
  lineas: readonly Linea[],
  quien: Sesion = local.mesero,
): Promise<Json> {
  const cliente = api(local, quien)
  const pedido = await cliente.post('/orders', {
    type: 'dine_in',
    table_id: mesa.id,
    client_request_id: `e2e-${unico()}`,
    items: items(lineas),
  })
  return cliente.post(`/orders/${String(pedido.id)}/send`)
}

/** La cocina lo marca listo y el mesero lo sirve. */
export async function servir(local: Local, pedidoId: number): Promise<Json> {
  await api(local, local.cocina).post(`/orders/${String(pedidoId)}/ready`)
  return api(local, local.mesero).post(`/orders/${String(pedidoId)}/served`)
}

/** Un pedido en mesa servido, listo para cobrar. */
export async function pedidoServido(local: Local, mesa: Mesa, lineas: readonly Linea[]): Promise<Json> {
  const pedido = await pedidoEnMesa(local, mesa, lineas)
  return servir(local, id(pedido))
}

/** Un pedido servido y pagado en un solo pago con tarjeta (la caja tiene que estar abierta). */
export async function pedidoPagado(local: Local, mesa: Mesa, lineas: readonly Linea[]): Promise<Json> {
  const pedido = await pedidoServido(local, mesa, lineas)
  return api(local, local.mesero).post(`/orders/${String(pedido.id)}/payments`, {
    payment_method: 'card',
    tip: '0',
  })
}

/** Un plato con un grupo obligatorio (término) y extras opcionales con precio. */
export async function platoConOpciones(local: Local): Promise<Plato> {
  const fondos = local.plato('Lomo saltado').categoriaId
  const creado = await api(local).post('/menu/items', {
    category_id: fondos,
    name: 'Bistec a lo pobre',
    price: '30.00',
    modifier_groups: [
      {
        name: 'Término',
        min_choices: 1,
        max_choices: 1,
        options: [
          { name: 'Jugoso', price: '0' },
          { name: 'A punto', price: '0' },
          { name: 'Bien cocido', price: '0' },
        ],
      },
      {
        name: 'Extras',
        min_choices: 0,
        max_choices: 2,
        options: [
          { name: 'Huevo frito', price: '2.50' },
          { name: 'Plátano', price: '3.00' },
          { name: 'Arroz extra', price: '4.00' },
        ],
      },
    ],
  })
  return { id: Number(creado.id), nombre: 'Bistec a lo pobre', precio: '30.00', categoriaId: fondos }
}

/**
 * `window.print()` abre el diálogo del sistema: en la prueba solo cuenta las
 * veces que se pidió, para comprobar que la hoja lanzó la impresión.
 */
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

/** Un pedido por su id, leído del API como encargado. */
export async function leerPedido(local: Local, pedidoId: number): Promise<Json> {
  return api(local).get(`/orders/${String(pedidoId)}`)
}
