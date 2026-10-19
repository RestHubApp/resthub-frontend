import type { CountHistoryItem, IngredientCountHistory } from '@/api/types'
import { BarList } from '@/components/charts/BarList'
import { ChartCard } from '@/components/charts/ChartCard'
import { DataGrid } from '@/components/charts/DataGrid'
import { EmptyState } from '@/components/EmptyState'
import { formatDateTime, formatPercent, formatSignedQuantity, toNumber } from '@/services/format'
import { differenceTone, formatSignedMoney } from './differenceMath'

interface DifferenceTrendProps {
  readonly history: IngredientCountHistory
  readonly timeZone: string
}

function percentText(item: CountHistoryItem): string {
  return item.difference_percent === null ? '—' : formatPercent(item.difference_percent)
}

/**
 * Las diferencias de un insumo en sus últimos conteos, con el estilo de los
 * gráficos del panel: una barra por conteo, del más nuevo al más viejo. Lo que
 * faltó va en el color de la serie y lo que sobró en gris; el signo va escrito.
 */
export function DifferenceTrend({ history, timeZone }: DifferenceTrendProps) {
  if (history.items.length === 0) {
    return <EmptyState title="Este insumo todavía no tiene conteos cerrados." />
  }
  const label = (item: CountHistoryItem) => `Conteo #${String(item.count_number)}`
  return (
    <ChartCard
      title="Últimos conteos"
      description="Lo que faltó o sobró en cada conteo, en soles."
      chart={
        <BarList
          label={`Diferencias de ${history.ingredient_name} por conteo`}
          data={history.items.map((item) => ({
            key: String(item.count_id),
            label: label(item),
            value: Math.abs(toNumber(item.difference_value)),
            valueLabel: formatSignedMoney(item.difference_value),
            tone: differenceTone(item.difference_value) === 'loss' ? 'series' : 'muted',
            details: [
              { label: 'cerrado', value: formatDateTime(item.closed_at, timeZone) },
              { label: 'diferencia', value: formatSignedQuantity(item.difference, history.unit) },
              { label: 'de lo esperado', value: percentText(item) },
            ],
          }))}
        />
      }
      table={
        <DataGrid
          caption={`Diferencias de ${history.ingredient_name} por conteo`}
          rowKey={(item) => String(item.count_id)}
          rows={history.items}
          columns={[
            { header: 'Conteo', cell: label },
            { header: 'Cerrado', cell: (item) => formatDateTime(item.closed_at, timeZone) },
            { header: 'Diferencia', cell: (item) => formatSignedQuantity(item.difference, history.unit), numeric: true },
            { header: '%', cell: percentText, numeric: true },
            { header: 'Valor', cell: (item) => formatSignedMoney(item.difference_value), numeric: true },
          ]}
        />
      }
    />
  )
}
