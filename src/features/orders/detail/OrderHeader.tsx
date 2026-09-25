import type { OrderResponse } from '../../../api/types'
import OrderStatusBadge from '../OrderStatusBadge'
import { formatMoney, formatTime } from '../../../services/format'
import { useTimeZone } from '../../../store/session'
import AllergyAlert from '../AllergyAlert'
import ItemNote from '../ItemNote'
import { allergyIn, type FlagFor } from '../noteFlags'
import { dishCount, orderPlace } from '../orderLabels'

interface OrderHeaderProps {
  readonly order: OrderResponse
  readonly flagFor: FlagFor
}

/** Numero, lugar, estado, mesero y total: lo que se lee primero de un pedido. */
export default function OrderHeader({ order, flagFor }: OrderHeaderProps) {
  const timeZone = useTimeZone()
  return (
    <header className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <h1 className="m-0 font-heading text-2xl leading-tight font-bold text-primary sm:text-3xl">
          Pedido #{order.number}
        </h1>
        <OrderStatusBadge status={order.status} label={order.status_label} />
        {allergyIn(order, flagFor) === undefined ? null : <AllergyAlert />}
      </div>
      <p className="m-0 text-lg font-semibold">{orderPlace(order)}</p>
      <p className="m-0 text-sm text-muted-foreground">
        {order.waiter_name} · abierto a las {formatTime(order.created_at, timeZone)} · {dishCount(order.item_count)}
      </p>
      <p className="m-0 text-3xl font-bold tabular-nums">{formatMoney(order.total)}</p>
      <ItemNote note={order.notes} flag={flagFor(order.id, null)} label="Nota del pedido" />
    </header>
  )
}
