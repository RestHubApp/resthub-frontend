import { queryOptions } from '@tanstack/react-query'

import { api } from '../services/api'
import type {
  ChangeItemRequest,
  ChargeOrderRequest,
  NewItemRequest,
  OpenOrderRequest,
  OrderListParams,
  OrderMenu,
  OrderPageResponse,
  OrderResponse,
  UpdateOrderRequest,
} from './types'

// Pedidos: tomarlos, moverlos por la cocina, cobrarlos y consultarlos.

export const ordersQueryKey = ['orders'] as const
export const activeOrdersQueryKey = [...ordersQueryKey, 'active'] as const

/** El tope de pagina que acepta el servidor. */
export const MAX_ORDERS_PAGE = 100

export function orderQueryKey(orderId: number) {
  return [...ordersQueryKey, 'detail', orderId] as const
}

export function orderListQueryKey(params: OrderListParams) {
  return [...ordersQueryKey, 'list', params] as const
}

// La carta vive bajo la misma raiz que usa la pantalla Menu: un aviso `menu`
// que invalide `['menu']` refresca tambien la que ve el mesero.
export const orderMenuQueryKey = ['menu', 'pedidos'] as const

function orderPath(orderId: number, action = ''): string {
  return `/orders/${String(orderId)}${action}`
}

/** La carta activa, con los platos agotados incluidos para mostrarlos como tales. */
export async function fetchOrderMenu(): Promise<OrderMenu> {
  const { data } = await api.get<OrderMenu>('/menu')
  return data
}

export const orderMenuQuery = queryOptions({ queryKey: orderMenuQueryKey, queryFn: fetchOrderMenu })

export async function fetchOrders(params: OrderListParams = {}): Promise<OrderPageResponse> {
  // El estado es una lista: FastAPI la espera como `status=a&status=b`.
  const { data } = await api.get<OrderPageResponse>('/orders', {
    params,
    paramsSerializer: { indexes: null },
  })
  return data
}

/** Los pedidos en curso, del mas antiguo al mas nuevo. */
export async function fetchActiveOrders(): Promise<OrderResponse[]> {
  const { data } = await api.get<OrderResponse[]>('/orders/active')
  return data
}

export const activeOrdersQuery = queryOptions({
  queryKey: activeOrdersQueryKey,
  queryFn: fetchActiveOrders,
})

export async function fetchOrder(orderId: number): Promise<OrderResponse> {
  const { data } = await api.get<OrderResponse>(orderPath(orderId))
  return data
}

export async function openOrder(payload: OpenOrderRequest): Promise<OrderResponse> {
  const { data } = await api.post<OrderResponse>('/orders', payload)
  return data
}

export async function updateOrder(
  orderId: number,
  payload: UpdateOrderRequest,
): Promise<OrderResponse> {
  const { data } = await api.patch<OrderResponse>(orderPath(orderId), payload)
  return data
}

export async function addOrderItems(
  orderId: number,
  items: NewItemRequest[],
): Promise<OrderResponse> {
  const { data } = await api.post<OrderResponse>(orderPath(orderId, '/items'), { items })
  return data
}

export async function changeOrderItem(
  orderId: number,
  itemId: number,
  payload: ChangeItemRequest,
): Promise<OrderResponse> {
  const { data } = await api.patch<OrderResponse>(
    orderPath(orderId, `/items/${String(itemId)}`),
    payload,
  )
  return data
}

export async function removeOrderItem(orderId: number, itemId: number): Promise<OrderResponse> {
  const { data } = await api.delete<OrderResponse>(orderPath(orderId, `/items/${String(itemId)}`))
  return data
}

/** Las transiciones sin cuerpo: enviar a cocina, listo y servido. */
export type OrderStep = 'send' | 'ready' | 'served'

export async function advanceOrder(orderId: number, step: OrderStep): Promise<OrderResponse> {
  const { data } = await api.post<OrderResponse>(orderPath(orderId, `/${step}`))
  return data
}

export async function cancelOrder(orderId: number, reason: string): Promise<OrderResponse> {
  const { data } = await api.post<OrderResponse>(orderPath(orderId, '/cancel'), { reason })
  return data
}

export async function chargeOrder(
  orderId: number,
  payload: ChargeOrderRequest,
): Promise<OrderResponse> {
  const { data } = await api.post<OrderResponse>(orderPath(orderId, '/charge'), payload)
  return data
}
