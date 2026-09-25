import type { OrderResponse } from '../../../api/types'
import { dishCount, formatHour, formatMoney } from '../format'
import { orderPlace } from '../orderLabels'
import OrderStatusBadge from '../OrderStatusBadge'

interface OrderHeaderProps {
  readonly order: OrderResponse
}

/** Numero, lugar, estado, mesero y total: lo que se lee primero de un pedido. */
export default function OrderHeader({ order }: OrderHeaderProps) {
  return (
    <header className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <h1 className="m-0 font-heading text-2xl leading-tight font-bold text-primary sm:text-3xl">
          Pedido #{order.number}
        </h1>
        <OrderStatusBadge status={order.status} label={order.status_label} />
      </div>
      <p className="m-0 text-lg font-semibold">{orderPlace(order)}</p>
      <p className="m-0 text-sm text-muted-foreground">
        {order.waiter_name} · abierto a las {formatHour(order.created_at)} · {dishCount(order.item_count)}
      </p>
      <p className="m-0 text-3xl font-bold tabular-nums">{formatMoney(order.total)}</p>
      {order.notes === '' ? null : (
        <p className="m-0 rounded-lg bg-muted px-3 py-2 text-sm">
          <span className="font-semibold">Nota del pedido:</span> {order.notes}
        </p>
      )}
    </header>
  )
}
