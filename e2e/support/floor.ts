// Ayudas de las pruebas del salón: pedidos preparados por el API, platos con
// opciones y la impresión del navegador reemplazada por un contador.
import type { APIResponse, Page } from '@playwright/test'

import { API_ORIGIN, unique, type Local, type Table, type Dish, type Session } from './api'

type Json = Record<string, unknown>

const API = `${API_ORIGIN}/api/v1`

async function body(response: APIResponse, that: string): Promise<Json> {
  if (!response.ok()) {
    throw new Error(`${that}: ${String(response.status())} ${await response.text()}`)
  }
  const text = await response.text()
  return text === '' ? {} : (JSON.parse(text) as Json)
}

/**
 * El API con el token de una cuenta, sin reusar la conexión.
 *
 * Entre dos llamadas una prueba pasa varios segundos en la pantalla; para
 * entonces uvicorn ya cerró la conexión que quedó abierta (a los 5 s) y
 * reusarla da «socket hang up». Cada llamada abre la suya.
 */
export class ApiFloor {
  private readonly local: Local
  private readonly token: string

  constructor(local: Local, who: Session) {
    this.local = local
    this.token = who.token
  }

  private options(data?: unknown) {
    return { headers: { Authorization: `Bearer ${this.token}`, Connection: 'close' }, data }
  }

  async get(route: string): Promise<Json> {
    return body(await this.local.http.get(`${API}${route}`, this.options()), `GET ${route}`)
  }

  /** Solo el código de estado, para comprobar un 404 o un rechazo. */
  async status(route: string): Promise<number> {
    return (await this.local.http.get(`${API}${route}`, this.options())).status()
  }

  async list(route: string): Promise<Json[]> {
    const data = (await this.get(route)) as unknown
    return Array.isArray(data) ? (data as Json[]) : (((data as Json).items ?? []) as Json[])
  }

  async post(route: string, data: unknown = {}): Promise<Json> {
    return body(await this.local.http.post(`${API}${route}`, this.options(data)), `POST ${route}`)
  }

  async patch(route: string, data: unknown): Promise<Json> {
    return body(await this.local.http.patch(`${API}${route}`, this.options(data)), `PATCH ${route}`)
  }
}

/** El API como esa cuenta; sin cuenta, como el encargado. */
export function api(local: Local, who: Session = local.owner): ApiFloor {
  return new ApiFloor(local, who)
}

export interface Line {
  readonly dish: Dish
  readonly quantity?: number
  readonly notes?: string
  /** Las opciones elegidas de un plato con `modifier_groups`. */
  readonly options?: readonly { readonly group: string; readonly option: string }[]
}

function items(lines: readonly Line[]) {
  return lines.map(({ dish, quantity = 1, notes = '', options = [] }) => ({
    menu_item_id: dish.id,
    quantity,
    notes,
    modifiers: options.map(({ group, option }) => ({ group, option })),
  }))
}

/** El número y el id de un pedido que devolvió el API. */
export function number(order: Json): string {
  return String(order.number)
}

export function id(order: Json): number {
  return Number(order.id)
}

/** Un pedido en mesa abierto que todavía no se envió a cocina. */
export async function openOrder(local: Local, table: Table, lines: readonly Line[]): Promise<Json> {
  return api(local, local.waiter).post('/orders', {
    type: 'dine_in',
    table_id: table.id,
    client_request_id: `e2e-${unique()}`,
    items: items(lines),
  })
}

/** Un pedido para llevar enviado a cocina. */
export async function orderTakeaway(
  local: Local,
  name: string,
  lines: readonly Line[],
  who: Session = local.waiter,
): Promise<Json> {
  const takeaway = api(local, who)
  const order = await takeaway.post('/orders', {
    type: 'takeaway',
    customer_name: name,
    client_request_id: `e2e-${unique()}`,
    items: items(lines),
  })
  return takeaway.post(`/orders/${String(order.id)}/send`)
}

/** Un delivery enviado a cocina. */
export async function orderDelivery(local: Local, customer: string, lines: readonly Line[]): Promise<Json> {
  const waiter = api(local, local.waiter)
  const order = await waiter.post('/orders', {
    type: 'delivery',
    customer_name: customer,
    customer_phone: '987654321',
    delivery_address: 'Av. Arequipa 123, Lince',
    delivery_reference: 'Frente al parque',
    client_request_id: `e2e-${unique()}`,
    items: items(lines),
  })
  return waiter.post(`/orders/${String(order.id)}/send`)
}

/** Un pedido en mesa abierto y enviado a cocina, como el celular del mesero. */
export async function orderInTable(
  local: Local,
  table: Table,
  lines: readonly Line[],
  who: Session = local.waiter,
): Promise<Json> {
  const customer = api(local, who)
  const order = await customer.post('/orders', {
    type: 'dine_in',
    table_id: table.id,
    client_request_id: `e2e-${unique()}`,
    items: items(lines),
  })
  return customer.post(`/orders/${String(order.id)}/send`)
}

/** La cocina lo marca listo y el mesero lo sirve. */
export async function serve(local: Local, orderId: number): Promise<Json> {
  await api(local, local.kitchen).post(`/orders/${String(orderId)}/ready`)
  return api(local, local.waiter).post(`/orders/${String(orderId)}/served`)
}

/** Un pedido en mesa servido, listo para cobrar. */
export async function orderServed(local: Local, table: Table, lines: readonly Line[]): Promise<Json> {
  const order = await orderInTable(local, table, lines)
  return serve(local, id(order))
}

/** Un pedido servido y pagado en un solo pago con tarjeta (la caja tiene que estar abierta). */
export async function orderPaid(local: Local, table: Table, lines: readonly Line[]): Promise<Json> {
  const order = await orderServed(local, table, lines)
  return api(local, local.waiter).post(`/orders/${String(order.id)}/payments`, {
    payment_method: 'card',
    tip: '0',
  })
}

/** Un plato con un grupo obligatorio (término) y extras opcionales con precio. */
export async function dishWithOptions(local: Local): Promise<Dish> {
  const funds = local.dish('Lomo saltado').categoryId
  const created = await api(local).post('/menu/items', {
    category_id: funds,
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
  return { id: Number(created.id), name: 'Bistec a lo pobre', price: '30.00', categoryId: funds }
}

/**
 * `window.print()` abre el diálogo del sistema: en la prueba solo cuenta las
 * veces que se pidió, para comprobar que la hoja lanzó la impresión.
 */
export async function countPrints(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const windowValue = window as unknown as { prints: number }
    windowValue.prints = 0
    window.print = () => {
      windowValue.prints += 1
    }
  })
}

export async function prints(page: Page): Promise<number> {
  return page.evaluate(() => (window as unknown as { prints: number }).prints)
}

/** Un pedido por su id, leído del API como encargado. */
export async function readOrder(local: Local, orderId: number): Promise<Json> {
  return api(local).get(`/orders/${String(orderId)}`)
}
