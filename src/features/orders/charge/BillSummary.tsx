import type { OrderResponse } from '../../../api/types'
import { formatMoney, formatPercent, toCents } from '../../../services/format'

interface BillSummaryProps {
  readonly order: OrderResponse
}

interface Row {
  readonly label: string
  readonly value: string
}

/** Las líneas que solo aparecen si cambian algo: cortesías, descuento y lo ya pagado. */
function adjustmentRows(order: OrderResponse): Row[] {
  const rows: Row[] = []
  if (toCents(order.courtesy_amount) > 0) {
    rows.push({ label: 'Cortesías', value: `− ${formatMoney(order.courtesy_amount)}` })
  }
  if (toCents(order.discount_amount) > 0) {
    rows.push({
      label: `Descuento ${formatPercent(order.discount_percent)}`,
      value: `− ${formatMoney(order.discount_amount)}`,
    })
  }
  if (toCents(order.paid_amount) > 0) {
    rows.push({ label: 'Ya pagado', value: `− ${formatMoney(order.paid_amount)}` })
  }
  return rows
}

/**
 * La cuenta: el total a precio de carta, lo que se descuenta y lo que falta.
 *
 * Lo que falta va grande: es lo que quien cobra le dice al cliente.
 */
export default function BillSummary({ order }: BillSummaryProps) {
  const ajustes = adjustmentRows(order)

  return (
    <div className="flex flex-col gap-2 rounded-lg bg-secondary px-4 py-3 text-secondary-foreground">
      {ajustes.length === 0 ? null : (
        <dl className="m-0 grid grid-cols-2 gap-y-1 text-sm">
          <dt>Platos</dt>
          <dd className="m-0 text-right tabular-nums">{formatMoney(order.subtotal)}</dd>
          {ajustes.map((row) => (
            <div key={row.label} className="contents">
              <dt>{row.label}</dt>
              <dd className="m-0 text-right tabular-nums">{row.value}</dd>
            </div>
          ))}
        </dl>
      )}
      <p className="m-0 flex items-baseline justify-between">
        <span className="font-medium">{toCents(order.paid_amount) > 0 ? 'Falta cobrar' : 'Total a cobrar'}</span>
        <span className="text-2xl font-bold tabular-nums">{formatMoney(order.balance)}</span>
      </p>
    </div>
  )
}
