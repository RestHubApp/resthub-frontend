import type { HourlyCell } from '@/api/types'
import type { TooltipRow } from '@/components/charts/ChartTooltip'
import { HeatmapCell } from './HeatmapCell'
import { CELL_HEIGHT, type HeatmapModel } from './heatmapModel'

// Las marcas del pico: un anillo del color de la superficie y otro de tinta.
const PEAK_RING = '0 0 0 2px var(--card), 0 0 0 4px var(--foreground)'
const ACTIVE_RING = '0 0 0 2px var(--card), 0 0 0 3px var(--muted-foreground)'

interface HeatmapRowsProps {
  readonly model: HeatmapModel
  readonly peak: HourlyCell | null
  /** La celda señalada con el teclado o el puntero, si hay una. */
  readonly active: HourlyCell | undefined
  readonly describe: (cell: HourlyCell) => { title: string; rows: readonly TooltipRow[] }
  /** Identificador de la celda de la fila `row` y la columna `column`. */
  readonly cellId: (row: number, column: number) => string
  /** Señala la celda con ese índice lineal. */
  readonly onPoint: (index: number) => void
}

function sameCell(a: HourlyCell, b: HourlyCell | null | undefined): boolean {
  return b?.weekday === a.weekday && b.hour === a.hour
}

// El pico conserva su anillo; la celda señalada lleva uno más suave.
function ringFor(cell: HourlyCell, peak: HourlyCell | null, active: HourlyCell | undefined): string | undefined {
  if (sameCell(cell, peak)) {
    return PEAK_RING
  }
  return sameCell(cell, active) ? ACTIVE_RING : undefined
}

/** Las filas de la grilla: un encabezado por día y una celda por hora. */
export function HeatmapRows({ model, peak, active, describe, cellId, onPoint }: HeatmapRowsProps) {
  const columns = model.hours.length

  return (
    <>
      {model.rows.map((dayRow, r) => (
        <div key={dayRow.weekday} role="row" className="contents">
          <span role="rowheader" aria-label={dayRow.label} className="text-xs leading-7 text-muted-foreground">
            {dayRow.label.slice(0, 3)}
          </span>
          {dayRow.cells.map((cell, c) => (
            <HeatmapCell
              key={cell.hour}
              id={cellId(r, c)}
              cell={cell}
              max={model.max}
              height={CELL_HEIGHT}
              ring={ringFor(cell, peak, active)}
              {...describe(cell)}
              onPoint={() => {
                onPoint(r * columns + c)
              }}
            />
          ))}
        </div>
      ))}
    </>
  )
}
