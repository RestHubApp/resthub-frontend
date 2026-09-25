import type { DailySalesPoint } from '../../api/types'
import EmptyState from '../../components/EmptyState'
import AreaChart from './charts/AreaChart'
import { formatInteger, formatLongDate, formatMoney, formatMoneyCompact, formatShortDate, toNumber } from './format'

/** La serie diaria de ventas, o un aviso si el rango es de un día. */
export default function SalesChart({ days }: { readonly days: readonly DailySalesPoint[] }) {
  if (days.length < 2) {
    return (
      <EmptyState
        title="Con un solo día no hay tendencia"
        description="Elige 7 o 30 días para ver cómo se mueven las ventas; el mapa por hora muestra el detalle de hoy."
      />
    )
  }
  const points = days.map((day) => ({ key: day.date, axisLabel: formatShortDate(day.date), value: toNumber(day.sales) }))
  return (
    <AreaChart
      points={points}
      label={`Ventas por día del ${formatLongDate(days[0]?.date ?? '')} al ${formatLongDate(days.at(-1)?.date ?? '')}`}
      formatValue={formatMoney}
      formatTick={formatMoneyCompact}
      describe={(index) => {
        const day = days[index]
        return {
          title: formatLongDate(day.date),
          rows: [
            { label: 'ventas', value: formatMoney(day.sales), swatch: 'var(--chart-1)' },
            { label: 'pedidos pagados', value: formatInteger(day.paid_orders) },
            { label: 'ticket promedio', value: formatMoney(day.average_ticket) },
          ],
        }
      }}
    />
  )
}
