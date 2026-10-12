import type { HourlyCell } from '@/api/types'
import type { TooltipRow } from '@/components/charts/ChartTooltip'

import { heatColor, heatStep } from './heatmapModel'

interface HeatmapCellProps {
  readonly id: string
  readonly cell: HourlyCell
  readonly max: number
  readonly height: number
  readonly ring: string | undefined
  readonly title: string
  readonly rows: readonly TooltipRow[]
  readonly onPoint: () => void
}

/** La lectura de una celda para quien no la ve: el título y cada valor, en una frase. */
function reading(title: string, rows: readonly TooltipRow[]): string {
  return [title, ...rows.map(({ label, value }) => `${label}: ${value}`)].join('. ')
}

/**
 * Una celda del mapa de calor: el color dice cuánto y el nombre accesible lo
 * dice con palabras. El foco real queda en la grilla; la celda señalada se
 * anuncia por `aria-activedescendant`.
 */
export function HeatmapCell({ id, cell, max, height, ring, title, rows, onPoint }: HeatmapCellProps) {
  return (
    <span
      id={id}
      role="gridcell"
      aria-label={reading(title, rows)}
      onPointerEnter={onPoint}
      className="rounded-[4px]"
      style={{ height, background: heatColor(heatStep(cell.paid_orders, max)), boxShadow: ring }}
    />
  )
}
