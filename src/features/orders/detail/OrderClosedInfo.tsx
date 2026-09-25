import type { OrderResponse } from '../../../api/types'
import { formatDateTime, formatMoney } from '../../../services/format'
import { useTimeZone } from '../../../store/session'

interface OrderClosedInfoProps {
  readonly order: OrderResponse
}

/** Como termino un pedido: cobrado con que y cuanto, o cancelado y por que. */
export default function OrderClosedInfo({ order }: OrderClosedInfoProps) {
  const timeZone = useTimeZone()
  if (order.status === 'cancelled') {
    return (
      <p className="m-0 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
        <span className="font-semibold">Cancelado</span>
        {order.cancelled_at === null ? '' : ` el ${formatDateTime(order.cancelled_at, timeZone)}`}. Motivo:{' '}
        {order.cancel_reason}
      </p>
    )
  }
  if (order.status !== 'paid') {
    return null
  }
  return (
    <dl className="m-0 grid grid-cols-2 gap-y-1 rounded-lg bg-success/10 px-4 py-3 text-sm text-success">
      <dt>Cobrado con</dt>
      <dd className="m-0 text-right font-semibold">{order.payment_method_label}</dd>
      {order.amount_received === null ? null : (
        <>
          <dt>Recibido</dt>
          <dd className="m-0 text-right tabular-nums">{formatMoney(order.amount_received)}</dd>
          <dt>Vuelto</dt>
          <dd className="m-0 text-right tabular-nums">{formatMoney(order.change ?? '0')}</dd>
        </>
      )}
      {order.paid_at === null ? null : (
        <>
          <dt>Fecha</dt>
          <dd className="m-0 text-right">{formatDateTime(order.paid_at, timeZone)}</dd>
        </>
      )}
    </dl>
  )
}
