// Los datos que necesitan las capturas, preparados por el API antes de abrir
// la pantalla: pedidos en cada estado, un plato con opciones y un pedido en
// la cola sin señal del celular.
import type { Page } from '@playwright/test'

import { unique, type Local, type Table, type Dish, type Session } from '../support/api'
import { api, id } from '../support/management'

type Json = Record<string, unknown>

export interface Line {
  readonly dish: Dish
  readonly quantity?: number
  readonly notes?: string
}

function items(lines: readonly Line[]) {
  return lines.map(({ dish, quantity = 1, notes = '' }) => ({ menu_item_id: dish.id, quantity, notes }))
}

/** Un pedido en mesa abierto, todavía sin enviar a cocina. */
export async function open(local: Local, table: Table, lines: readonly Line[]): Promise<Json> {
  return api(local, local.waiter).post('/orders', {
    type: 'dine_in',
    table_id: table.id,
    client_request_id: `e2e-${unique()}`,
    items: items(lines),
  })
}

/** Un pedido en mesa enviado a cocina. */
export async function inKitchen(local: Local, table: Table, lines: readonly Line[]): Promise<Json> {
  const order = await open(local, table, lines)
  return api(local, local.waiter).post(`/orders/${String(id(order))}/send`)
}

/** Un pedido en mesa servido, por cobrar. */
export async function served(local: Local, table: Table, lines: readonly Line[]): Promise<Json> {
  const order = await inKitchen(local, table, lines)
  await api(local, local.kitchen).post(`/orders/${String(id(order))}/ready`)
  return api(local, local.waiter).post(`/orders/${String(id(order))}/served`)
}

/** Un pedido para llevar enviado a cocina. */
export async function takeaway(local: Local, customer: string, lines: readonly Line[]): Promise<Json> {
  const waiter = api(local, local.waiter)
  const order = await waiter.post('/orders', {
    type: 'takeaway',
    customer_name: customer,
    client_request_id: `e2e-${unique()}`,
    items: items(lines),
  })
  return waiter.post(`/orders/${String(id(order))}/send`)
}

/** Un delivery enviado a cocina. */
export async function delivery(local: Local, customer: string, lines: readonly Line[]): Promise<Json> {
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
  return waiter.post(`/orders/${String(id(order))}/send`)
}

/** Un plato con un grupo obligatorio (término) y extras opcionales con precio. */
export async function dishWithOptions(local: Local): Promise<void> {
  await api(local).post('/menu/items', {
    category_id: local.dish('Lomo saltado').categoryId,
    name: 'Bistec a lo pobre',
    price: '30.00',
    modifier_groups: [
      {
        name: 'Término',
        min_choices: 1,
        max_choices: 1,
        options: ['Jugoso', 'A punto', 'Bien cocido'].map((name) => ({ name, price: '0' })),
      },
      {
        name: 'Extras',
        min_choices: 0,
        max_choices: 2,
        options: [
          { name: 'Huevo frito', price: '2.50' },
          { name: 'Plátano', price: '3.00' },
        ],
      },
    ],
  })
}

const QUEUE = 'resthub.pedidos-sin-enviar.v2'

/**
 * Deja un pedido tomado sin señal en la cola del celular y recarga la página.
 *
 * El envío automático de la cola choca con un corte de red simulado en
 * `POST /orders`, así que el pedido sigue esperando mientras se captura.
 * `almacen` es `localStorage` en una pestaña normal y `sessionStorage` en una
 * de vista previa, igual que la cola de la aplicación.
 */
export interface InQueue {
  readonly owner: { readonly userId: number; readonly restaurantId: number }
  readonly table: Pick<Table, 'id' | 'label'>
  readonly dish: Pick<Dish, 'id'>
  readonly storage?: 'localStorage' | 'sessionStorage'
}

export async function orderInQueue(page: Page, { owner, table, dish, storage = 'localStorage' }: InQueue): Promise<void> {
  await page.route('**/api/v1/orders', (route, request) =>
    request.method() === 'POST' ? route.abort('internetdisconnected') : route.fallback(),
  )
  const order = {
    ...owner,
    request: {
      type: 'dine_in',
      table_id: table.id,
      client_request_id: `e2e-${unique()}`,
      items: [{ menu_item_id: dish.id, quantity: 1, notes: '' }],
    },
    queuedAt: '2026-09-26T15:00:00.000Z',
    label: `Mesa ${table.label}`,
  }
  await page.evaluate(
    ([key, value, where]) => {
      window[where].setItem(key, value)
    },
    [QUEUE, JSON.stringify([order]), storage] as const,
  )
  await page.reload()
}

/** La persona y el local de una sesión, como los guarda la cola. */
export function ownerOf(session: Session): { userId: number; restaurantId: number } {
  const account = session.account as { user: { id: number }; restaurant: { id: number } }
  return { userId: account.user.id, restaurantId: account.restaurant.id }
}
