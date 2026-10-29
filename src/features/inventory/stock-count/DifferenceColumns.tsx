import type { CountDifference } from '@/api/types'
import type { DataColumn } from '@/components/DataTable'
import { Icon } from '@/components/Icon'
import { Button } from '@/components/ui/button'
import { formatPercent, formatQuantity, formatSignedQuantity } from '@/services/format'
import { DifferenceIngredient } from './DifferenceIngredient'
import { differenceTone, formatSignedMoney } from './differenceMath'

const TONES = { loss: 'text-destructive', gain: 'text-success', even: '' } as const

const NUMERIC = 'tabular-nums'

function unitOf(line: CountDifference): string {
  return line.unit
}

/** Las columnas del reporte de diferencias; `onTrend` abre la tendencia del insumo. */
export function buildDifferenceColumns(onTrend: (line: CountDifference) => void): DataColumn<CountDifference>[] {
  return [
    { id: 'insumo', header: 'Insumo', className: 'min-w-44 whitespace-normal', cell: (line) => <DifferenceIngredient line={line} /> },
    { id: 'esperado', header: 'Esperado', className: NUMERIC, cell: (line) => formatQuantity(line.expected, unitOf(line)) },
    { id: 'contado', header: 'Contado', className: NUMERIC, cell: (line) => formatQuantity(line.counted, unitOf(line)) },
    {
      id: 'diferencia',
      header: 'Diferencia',
      className: `${NUMERIC} font-semibold`,
      cell: (line) => <span className={TONES[differenceTone(line.difference_value)]}>{formatSignedQuantity(line.difference, unitOf(line))}</span>,
    },
    {
      id: 'porcentaje',
      header: '%',
      className: NUMERIC,
      cell: (line) => (line.difference_percent === null ? '—' : formatPercent(line.difference_percent)),
    },
    {
      id: 'valor',
      header: 'Valor',
      className: `${NUMERIC} font-semibold`,
      cell: (line) => <span className={TONES[differenceTone(line.difference_value)]}>{formatSignedMoney(line.difference_value)}</span>,
    },
    {
      id: 'tendencia',
      header: 'Tendencia',
      cell: (line) => (
        <Button type="button" variant="outline" size="sm" aria-label={`Ver tendencia de ${line.ingredient_name}`} onClick={() => { onTrend(line) }}>
          <Icon name="chart" size={14} />
          <span>Ver</span>
        </Button>
      ),
    },
  ]
}
