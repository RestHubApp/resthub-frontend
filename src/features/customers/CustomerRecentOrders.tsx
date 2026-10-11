import { Link } from 'react-router'

import type { Customer } from '@/api/types'
import { formatDateTime, formatMoney } from '@/services/format'
import { paths } from '@/services/paths'

// El tipo de pedido con el mismo nombre que usan el tablero y el historial.
// El API manda el tipo como texto libre: uno que no está en la lista se muestra tal cual.
const TYPES: Partial<Record<string, string>> = {
  dine_in: 'En mesa',
  takeaway: 'Para llevar',
  delivery: 'Delivery',
}

interface CustomerRecentOrdersProps {
  readonly orders: Customer['recent_orders']
  readonly timeZone: string
}

/** Los últimos pedidos de un cliente, cada uno con enlace a su detalle. */
export function CustomerRecentOrders({ orders, timeZone }: CustomerRecentOrdersProps) {
  return (
    <>
      <h3 className="m-0 text-sm font-semibold">Últimos pedidos</h3>
      {orders.length === 0 ? <p className="m-0 text-sm text-muted-foreground">Todavía no pidió.</p> : null}
      <ul className="m-0 flex list-none flex-col gap-1 p-0">
        {orders.map((order) => (
          <li key={order.order_id}>
            <Link
              to={paths.orders.detail(order.order_id)}
              className="flex min-h-11 items-center justify-between gap-2 rounded-md px-2 hover:bg-muted"
            >
              <span>
                #{order.number} · {TYPES[order.type] ?? order.type}
              </span>
              <span className="text-sm text-muted-foreground">
                {formatMoney(order.total)} · {formatDateTime(order.created_at, timeZone)}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  )
}
