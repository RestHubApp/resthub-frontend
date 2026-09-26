import { activeOrdersQuery, orderMenuQuery } from '../../api/orders'
import { tablesQuery } from '../../api/tables'
import { prefetch } from '../../services/queryClient'
import { can } from '../../store/session'

/** Pedidos: las mesas del salón y la carta con la que el mesero toma el pedido. */
export function prefetchFloor(): void {
  if (can('tables.read')) {
    prefetch(tablesQuery(false))
  }
  if (can('menu.read')) {
    prefetch(orderMenuQuery)
  }
}

/** Cocina: los pedidos en curso, que también ve el mesero. */
export function prefetchKitchen(): void {
  if (can('orders.take')) {
    prefetch(activeOrdersQuery)
  }
}

/** Tablero: los pedidos en curso. */
export function prefetchBoard(): void {
  if (can('orders.read_all')) {
    prefetch(activeOrdersQuery)
  }
}
