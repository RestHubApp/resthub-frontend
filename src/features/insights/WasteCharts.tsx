import type { WasteReport } from '../../api/types'
import EmptyState from '../../components/EmptyState'
import BarList from './charts/BarList'
import { formatInteger, formatMoney, formatPercent, formatQuantity, toNumber } from './format'

interface WasteChartsProps {
  readonly report: WasteReport
}

const TOP_INGREDIENTS = 8
const SUBTITLE = 'm-0 text-sm font-semibold text-foreground'

/** El costo de las mermas por causa y por insumo, lado a lado. */
export default function WasteCharts({ report }: WasteChartsProps) {
  if (report.events === 0) {
    return <EmptyState title="No se registraron mermas en este rango." />
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="flex flex-col gap-2">
        <h3 className={SUBTITLE}>Por causa</h3>
        <BarList
          label="Costo de las mermas por causa"
          data={report.by_cause.map((row) => ({
            key: row.cause ?? 'pendiente',
            label: row.label,
            value: toNumber(row.cost),
            valueLabel: formatMoney(row.cost),
            tone: row.cause === null ? 'muted' : 'series',
            details: [
              { label: 'costo', value: formatMoney(row.cost) },
              { label: 'del total', value: formatPercent(row.share_percent) },
              { label: 'mermas', value: formatInteger(row.events) },
            ],
          }))}
        />
      </div>
      <div className="flex flex-col gap-2">
        <h3 className={SUBTITLE}>Por insumo</h3>
        <BarList
          label="Costo de las mermas por insumo"
          data={report.by_ingredient.slice(0, TOP_INGREDIENTS).map((row) => ({
            key: String(row.ingredient_id),
            label: row.name,
            value: toNumber(row.cost),
            valueLabel: formatMoney(row.cost),
            details: [
              { label: 'costo', value: formatMoney(row.cost) },
              { label: 'perdido', value: formatQuantity(row.quantity, row.unit) },
              { label: 'mermas', value: formatInteger(row.events) },
            ],
          }))}
        />
      </div>
    </div>
  )
}
