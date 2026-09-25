import type { SalesSummary } from '../../api/types'
import KpiTile from './KpiTile'
import { formatInteger, formatMoney, formatShortDate, toNumber } from '../../services/format'

interface KpiRowProps {
  readonly summary: SalesSummary
}

const PERCENT = 100

// El servidor no trae la variación de cancelados: se calcula igual que las otras.
function cancelledChange(summary: SalesSummary): string | null {
  const antes = summary.previous.cancelled_orders
  if (antes === 0) {
    return null
  }
  return String(((summary.cancelled_orders - antes) / antes) * PERCENT)
}

/** Ventas, pedidos pagados, ticket promedio y cancelados del período, contra el anterior. */
export default function KpiRow({ summary }: KpiRowProps) {
  const { previous } = summary
  const comparado = `${formatShortDate(previous.date_from)} – ${formatShortDate(previous.date_to)}`

  return (
    <section aria-label="Indicadores del período" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <KpiTile
        label="Ventas"
        value={formatMoney(summary.sales)}
        change={summary.sales_change_percent}
        higherIsBetter
        comparedTo={comparado}
      />
      <KpiTile
        label="Pedidos pagados"
        value={formatInteger(summary.paid_orders)}
        change={summary.paid_orders_change_percent}
        higherIsBetter
        comparedTo={comparado}
      />
      <KpiTile
        label="Ticket promedio"
        value={formatMoney(summary.average_ticket)}
        change={summary.average_ticket_change_percent}
        higherIsBetter
        comparedTo={comparado}
      />
      <KpiTile
        label="Cancelados"
        value={formatInteger(summary.cancelled_orders)}
        detail={toNumber(summary.cancelled_amount) > 0 ? `${formatMoney(summary.cancelled_amount)} sin cobrar` : undefined}
        change={cancelledChange(summary)}
        higherIsBetter={false}
        comparedTo={comparado}
      />
    </section>
  )
}
