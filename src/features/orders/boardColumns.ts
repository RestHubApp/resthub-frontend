import type { OrderResponse, OrderStatus } from '@/api/types'
import type { TypeFilterValue } from './board/TypeFilter'

/** Los estados del tablero, de izquierda a derecha. */
export const COLUMNS: readonly OrderStatus[] = ['open', 'in_kitchen', 'ready', 'served']

/** Cuantos pedidos hay en total y de cada tipo, para los contadores del filtro. */
export function countByType(orders: readonly OrderResponse[]): Record<TypeFilterValue, number> {
  const ofType = (type: OrderResponse['type']) => orders.filter((order) => order.type === type).length
  return { all: orders.length, dine_in: ofType('dine_in'), takeaway: ofType('takeaway'), delivery: ofType('delivery') }
}
