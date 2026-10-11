import { activeOrdersQuery, orderMenuQuery } from '@/api/orders'
import { PERMISSION } from '@/api/permissions'
import { tablesQuery } from '@/api/tables'
import { prefetch } from '@/services/queryClient'
import { can } from '@/store/session'

/** Pedidos: las mesas del salón y la carta con la que el mesero toma el pedido. */
export function prefetchFloor(): void {
  if (can(PERMISSION.tablesRead)) {
    prefetch(tablesQuery(false))
  }
  if (can(PERMISSION.menuRead)) {
    prefetch(orderMenuQuery)
  }
}

/** Cocina: los pedidos en curso, que también ve el mesero. */
export function prefetchKitchen(): void {
  if (can(PERMISSION.ordersTake)) {
    prefetch(activeOrdersQuery)
  }
}

/** Tablero: los pedidos en curso. */
export function prefetchBoard(): void {
  if (can(PERMISSION.ordersReadAll)) {
    prefetch(activeOrdersQuery)
  }
}
