import { queryOptions } from '@tanstack/react-query'

import { send } from './client'
import type {
  ChangeItemRequest,
  DiscountRequest,
  NewItemRequest,
  OpenOrderRequest,
  OrderListParams,
  OrderMenu,
  OrderPageResponse,
  OrderResponse,
  PaymentRequest,
} from './types'

// Pedidos: tomarlos, moverlos por la cocina, cobrarlos y consultarlos.

export const ordersQueryKey = ['orders'] as const
const activeOrdersQueryKey = [...ordersQueryKey, 'active'] as const

/** El tope de pagina que acepta el servidor. */
export const MAX_ORDERS_PAGE = 100

export function orderQueryKey(orderId: number) {
  return [...ordersQueryKey, 'detail', orderId] as const
}

function orderListQueryKey(params: OrderListParams) {
  return [...ordersQueryKey, 'list', params] as const
}

// La carta vive bajo la misma raiz que usa la pantalla Menu: un aviso `menu`
// que invalide `['menu']` refresca tambien la que ve el mesero.
const orderMenuQueryKey = ['menu', 'pedidos'] as const

/** La carta activa, con los platos agotados incluidos para mostrarlos como tales. */
export async function fetchOrderMenu(): Promise<OrderMenu> {
  return send((client) => client.GET('/api/v1/menu'))
}

export const orderMenuQuery = queryOptions({ queryKey: orderMenuQueryKey, queryFn: fetchOrderMenu })

async function fetchOrders(params: OrderListParams = {}): Promise<OrderPageResponse> {
  // El estado es una lista: FastAPI la espera como `status=a&status=b`, la
  // forma por defecto del cliente.
  return send((client) => client.GET('/api/v1/orders', { params: { query: params } }))
}

/** Los pedidos en curso, del mas antiguo al mas nuevo. */
async function fetchActiveOrders(): Promise<OrderResponse[]> {
  return send((client) => client.GET('/api/v1/orders/active'))
}

export const activeOrdersQuery = queryOptions({
  queryKey: activeOrdersQueryKey,
  queryFn: fetchActiveOrders,
})

export async function fetchOrder(orderId: number): Promise<OrderResponse> {
  return send((client) => client.GET('/api/v1/orders/{order_id}', { params: { path: { order_id: orderId } } }))
}

export async function openOrder(payload: OpenOrderRequest): Promise<OrderResponse> {
  return send((client) => client.POST('/api/v1/orders', { body: payload }))
}

export async function addOrderItems(
  orderId: number,
  items: NewItemRequest[],
): Promise<OrderResponse> {
  return send((client) =>
    client.POST('/api/v1/orders/{order_id}/items', { params: { path: { order_id: orderId } }, body: { items } }),
  )
}

export async function changeOrderItem(
  orderId: number,
  itemId: number,
  payload: ChangeItemRequest,
): Promise<OrderResponse> {
  return send((client) =>
    client.PATCH('/api/v1/orders/{order_id}/items/{item_id}', {
      params: { path: { order_id: orderId, item_id: itemId } },
      body: payload,
    }),
  )
}

export async function removeOrderItem(orderId: number, itemId: number): Promise<OrderResponse> {
  return send((client) =>
    client.DELETE('/api/v1/orders/{order_id}/items/{item_id}', {
      params: { path: { order_id: orderId, item_id: itemId } },
    }),
  )
}

/** Las transiciones sin cuerpo: enviar a cocina, listo y servido. */
export type OrderStep = 'send' | 'ready' | 'served'

export async function advanceOrder(orderId: number, step: OrderStep): Promise<OrderResponse> {
  const params = { path: { order_id: orderId } }
  switch (step) {
    case 'send': {
      return send((client) => client.POST('/api/v1/orders/{order_id}/send', { params }))
    }
    case 'ready': {
      return send((client) => client.POST('/api/v1/orders/{order_id}/ready', { params }))
    }
    case 'served': {
      return send((client) => client.POST('/api/v1/orders/{order_id}/served', { params }))
    }
  }
}

export async function cancelOrder(orderId: number, reason: string): Promise<OrderResponse> {
  return send((client) =>
    client.POST('/api/v1/orders/{order_id}/cancel', { params: { path: { order_id: orderId } }, body: { reason } }),
  )
}

/** Una parte de la cuenta: por monto, por platos o, sin ninguno, lo que falta. */
export async function addPayment(orderId: number, payload: PaymentRequest): Promise<OrderResponse> {
  return send((client) =>
    client.POST('/api/v1/orders/{order_id}/payments', { params: { path: { order_id: orderId } }, body: payload }),
  )
}

/** Descuento en porcentaje; cero lo quita. */
export async function applyDiscount(
  orderId: number,
  payload: DiscountRequest,
): Promise<OrderResponse> {
  return send((client) =>
    client.PUT('/api/v1/orders/{order_id}/discount', { params: { path: { order_id: orderId } }, body: payload }),
  )
}

/** La casa invita el plato: se sirve y no se cobra. */
export async function grantCourtesy(
  orderId: number,
  itemId: number,
  reason: string,
): Promise<OrderResponse> {
  return send((client) =>
    client.PUT('/api/v1/orders/{order_id}/items/{item_id}/courtesy', {
      params: { path: { order_id: orderId, item_id: itemId } },
      body: { reason },
    }),
  )
}

export async function revokeCourtesy(orderId: number, itemId: number): Promise<OrderResponse> {
  return send((client) =>
    client.DELETE('/api/v1/orders/{order_id}/items/{item_id}/courtesy', {
      params: { path: { order_id: orderId, item_id: itemId } },
    }),
  )
}

/**
 * Anula un plato que ya salió a cocina: queda en el pedido, tachado y con su
 * motivo, pero no suma en el total ni en el cobro.
 */
export async function voidOrderItem(
  orderId: number,
  itemId: number,
  reason: string,
): Promise<OrderResponse> {
  return send((client) =>
    client.POST('/api/v1/orders/{order_id}/items/{item_id}/void', {
      params: { path: { order_id: orderId, item_id: itemId } },
      body: { reason },
    }),
  )
}

/**
 * Anula un cobro mal hecho del turno de caja abierto (RFS-25): queda a la vista
 * con su motivo, deja de sumar y el pedido vuelve a deber ese monto.
 */
export async function voidPayment(orderId: number, paymentId: number, reason: string): Promise<OrderResponse> {
  return send((client) =>
    client.POST('/api/v1/orders/{order_id}/payments/{payment_id}/void', {
      params: { path: { order_id: orderId, payment_id: paymentId } },
      body: { reason },
    }),
  )
}

/** Los comensales se mudaron: el pedido pasa a otra mesa libre. */
export async function moveOrder(orderId: number, tableId: number): Promise<OrderResponse> {
  return send((client) =>
    client.POST('/api/v1/orders/{order_id}/move', {
      params: { path: { order_id: orderId } },
      body: { table_id: tableId },
    }),
  )
}

/** Une otra mesa a este pedido: sus platos pasan acá y ella queda libre. */
export async function mergeOrders(orderId: number, sourceOrderId: number): Promise<OrderResponse> {
  return send((client) =>
    client.POST('/api/v1/orders/{order_id}/merge', {
      params: { path: { order_id: orderId } },
      body: { source_order_id: sourceOrderId },
    }),
  )
}

export function orderQuery(orderId: number) {
  return queryOptions({ queryKey: orderQueryKey(orderId), queryFn: () => fetchOrder(orderId) })
}

export function ordersQuery(params: OrderListParams) {
  return queryOptions({ queryKey: orderListQueryKey(params), queryFn: () => fetchOrders(params) })
}
