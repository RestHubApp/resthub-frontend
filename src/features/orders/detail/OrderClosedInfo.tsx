import type { OrderResponse } from '../../../api/types'
import { formatDateTime, formatMoney, formatPercent, toCents } from '../../../services/format'
import { useTimeZone } from '../../../store/session'
import PaymentsDone from '../charge/PaymentsDone'
import InvoicePanel from '../invoice/InvoicePanel'

interface OrderClosedInfoProps {
  readonly order: OrderResponse
}

interface Row {
  readonly label: string
  readonly value: string
}

/** Lo que conviene ver de un cobro: medio, descuento, cortesías, propinas y vuelto. */
function paidRows(order: OrderResponse, timeZone: string): Row[] {
  const rows: Row[] = [{ label: 'Pagado con', value: order.payment_method_label ?? '—' }]
  if (toCents(order.discount_amount) > 0) {
    rows.push({
      label: `Descuento ${formatPercent(order.discount_percent)}`,
      value: `${formatMoney(order.discount_amount)} · ${order.discount_reason}`,
    })
  }
  if (toCents(order.courtesy_amount) > 0) {
    rows.push({ label: 'Cortesías', value: formatMoney(order.courtesy_amount) })
  }
  if (toCents(order.tips) > 0) {
    rows.push({ label: 'Propinas', value: formatMoney(order.tips) })
  }
  if (order.amount_received !== null) {
    rows.push({ label: 'Recibido', value: formatMoney(order.amount_received) })
    rows.push({ label: 'Vuelto', value: formatMoney(order.change ?? '0') })
  }
  if (order.paid_at !== null) {
    rows.push({ label: 'Fecha', value: formatDateTime(order.paid_at, timeZone) })
  }
  return rows
}

/** Cómo terminó un pedido: cobrado con qué y cuánto, o cancelado y por qué. */
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
    // Una cuenta dividida a medio cobrar: se ve qué pagó cada uno.
    return <PaymentsDone order={order} />
  }
  return (
    <div className="flex flex-col gap-3">
      <dl className="m-0 grid grid-cols-2 gap-y-1 rounded-lg bg-success/10 px-4 py-3 text-sm text-success">
        {paidRows(order, timeZone).map((row) => (
          <div key={row.label} className="contents">
            <dt>{row.label}</dt>
            <dd className="m-0 text-right tabular-nums">{row.value}</dd>
          </div>
        ))}
      </dl>
      {order.payments.length > 1 ? <PaymentsDone order={order} /> : null}
      <InvoicePanel order={order} />
    </div>
  )
}
