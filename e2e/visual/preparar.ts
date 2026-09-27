// Los datos que necesitan las capturas, preparados por el API antes de abrir
// la pantalla: pedidos en cada estado, un plato con opciones y un pedido en
// la cola sin señal del celular.
import type { Page } from '@playwright/test'

import { unico, type Local, type Mesa, type Plato, type Sesion } from '../soporte/api'
import { api, id } from '../soporte/gestion'

type Json = Record<string, unknown>

export interface Linea {
  readonly plato: Plato
  readonly cantidad?: number
  readonly notas?: string
}

function items(lineas: readonly Linea[]) {
  return lineas.map(({ plato, cantidad = 1, notas = '' }) => ({ menu_item_id: plato.id, quantity: cantidad, notes: notas }))
}

/** Un pedido en mesa abierto, todavía sin enviar a cocina. */
export async function abierto(local: Local, mesa: Mesa, lineas: readonly Linea[]): Promise<Json> {
  return api(local, local.mesero).post('/orders', {
    type: 'dine_in',
    table_id: mesa.id,
    client_request_id: `e2e-${unico()}`,
    items: items(lineas),
  })
}

/** Un pedido en mesa enviado a cocina. */
export async function enCocina(local: Local, mesa: Mesa, lineas: readonly Linea[]): Promise<Json> {
  const pedido = await abierto(local, mesa, lineas)
  return api(local, local.mesero).post(`/orders/${String(id(pedido))}/send`)
}

/** Un pedido en mesa servido, por cobrar. */
export async function servido(local: Local, mesa: Mesa, lineas: readonly Linea[]): Promise<Json> {
  const pedido = await enCocina(local, mesa, lineas)
  await api(local, local.cocina).post(`/orders/${String(id(pedido))}/ready`)
  return api(local, local.mesero).post(`/orders/${String(id(pedido))}/served`)
}

/** Un pedido para llevar enviado a cocina. */
export async function paraLlevar(local: Local, cliente: string, lineas: readonly Linea[]): Promise<Json> {
  const mesero = api(local, local.mesero)
  const pedido = await mesero.post('/orders', {
    type: 'takeaway',
    customer_name: cliente,
    client_request_id: `e2e-${unico()}`,
    items: items(lineas),
  })
  return mesero.post(`/orders/${String(id(pedido))}/send`)
}

/** Un delivery enviado a cocina. */
export async function delivery(local: Local, cliente: string, lineas: readonly Linea[]): Promise<Json> {
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
  return mesero.post(`/orders/${String(id(pedido))}/send`)
}

/** Un plato con un grupo obligatorio (término) y extras opcionales con precio. */
export async function platoConOpciones(local: Local): Promise<void> {
  await api(local).post('/menu/items', {
    category_id: local.plato('Lomo saltado').categoriaId,
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

const COLA = 'resthub.pedidos-sin-enviar.v2'

/**
 * Deja un pedido tomado sin señal en la cola del celular y recarga la página.
 *
 * El envío automático de la cola choca con un corte de red simulado en
 * `POST /orders`, así que el pedido sigue esperando mientras se captura.
 * `almacen` es `localStorage` en una pestaña normal y `sessionStorage` en una
 * de vista previa, igual que la cola de la aplicación.
 */
export interface EnCola {
  readonly dueno: { readonly userId: number; readonly restaurantId: number }
  readonly mesa: Pick<Mesa, 'id' | 'etiqueta'>
  readonly plato: Pick<Plato, 'id'>
  readonly almacen?: 'localStorage' | 'sessionStorage'
}

export async function pedidoEnCola(page: Page, { dueno, mesa, plato, almacen = 'localStorage' }: EnCola): Promise<void> {
  await page.route('**/api/v1/orders', (route, peticion) =>
    peticion.method() === 'POST' ? route.abort('internetdisconnected') : route.fallback(),
  )
  const pedido = {
    ...dueno,
    request: {
      type: 'dine_in',
      table_id: mesa.id,
      client_request_id: `e2e-${unico()}`,
      items: [{ menu_item_id: plato.id, quantity: 1, notes: '' }],
    },
    queuedAt: '2026-09-26T15:00:00.000Z',
    label: `Mesa ${mesa.etiqueta}`,
  }
  await page.evaluate(
    ([clave, valor, donde]) => {
      window[donde].setItem(clave, valor)
    },
    [COLA, JSON.stringify([pedido]), almacen] as const,
  )
  await page.reload()
}

/** La persona y el local de una sesión, como los guarda la cola. */
export function duenoDe(sesion: Sesion): { userId: number; restaurantId: number } {
  const cuenta = sesion.cuenta as { user: { id: number }; restaurant: { id: number } }
  return { userId: cuenta.user.id, restaurantId: cuenta.restaurant.id }
}
