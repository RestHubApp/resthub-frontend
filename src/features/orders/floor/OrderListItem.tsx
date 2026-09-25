import { Link } from 'react-router'

import type { OrderResponse } from '../../../api/types'
import { formatHour, formatMoney } from '../format'
import { orderPlace } from '../orderLabels'
import OrderStatusBadge from '../OrderStatusBadge'

interface OrderListItemProps {
  readonly order: OrderResponse
}

/** Un pedido en una lista del mesero: numero, lugar, estado y total. */
export default function OrderListItem({ order }: OrderListItemProps) {
  return (
    <Link
      to={`/pedidos/${String(order.id)}`}
      className="flex min-h-16 items-center gap-3 rounded-xl bg-card px-4 py-3 ring-1 ring-foreground/10 outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <span className="min-w-12 font-heading text-lg font-bold tabular-nums">#{order.number}</span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate font-medium">{orderPlace(order)}</span>
        <span className="text-sm text-muted-foreground">
          {formatHour(order.created_at)} · {order.waiter_name}
        </span>
      </span>
      <span className="flex flex-col items-end gap-1">
        <OrderStatusBadge status={order.status} label={order.status_label} />
        <span className="text-sm font-semibold tabular-nums">{formatMoney(order.total)}</span>
      </span>
    </Link>
  )
}
