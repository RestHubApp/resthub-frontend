import { useId } from 'react'

import type { HourlyCell } from '@/api/types'
import { ChartTooltip, type TooltipRow } from '@/components/charts/ChartTooltip'
import { HeatmapCell } from './HeatmapCell'
import { HeatmapHeader } from './HeatmapHeader'
import { HeatmapLegend } from './HeatmapLegend'
import { heatmapModel } from './heatmapModel'
import { useChartCursor } from '@/components/charts/useChartCursor'
import { useElementWidth } from '@/components/charts/useElementWidth'

interface HeatmapProps {
  readonly cells: readonly HourlyCell[]
  readonly peak: HourlyCell | null
  readonly label: string
  readonly describe: (cell: HourlyCell) => { title: string; rows: readonly TooltipRow[] }
}

const LABEL_WIDTH = 44
const GAP = 2
const CELL_HEIGHT = 28
const HEADER_HEIGHT = 20
// Las marcas del pico: un anillo del color de la superficie y otro de tinta.
const PEAK_RING = '0 0 0 2px var(--card), 0 0 0 4px var(--foreground)'
const ACTIVE_RING = '0 0 0 2px var(--card), 0 0 0 3px var(--muted-foreground)'

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

/**
 * Pedidos por día de la semana y hora: una rampa de un solo tono, más oscuro
 * es más. El cero va en gris para no confundirse con "poco". El pico lleva un
 * anillo, además del color, y su lectura escrita arriba.
 */
export function Heatmap({ cells, peak, label, describe }: HeatmapProps) {
  const [ref, width] = useElementWidth<HTMLDivElement>()
  const idPrefix = useId()
  const model = heatmapModel(cells)
  const columns = model.hours.length
  const cursor = useChartCursor(model.rows.length * columns, columns)
  const widthCell = columns === 0 ? 0 : (width - LABEL_WIDTH - GAP * columns) / columns

  const row = cursor.active === null ? 0 : Math.floor(cursor.active / columns)
  const column = cursor.active === null ? 0 : cursor.active % columns
  const active = cursor.active === null ? undefined : model.rows[row]?.cells[column]
  const cellId = (r: number, c: number) => `${idPrefix}-${String(r)}-${String(c)}`

  return (
    <div className="flex flex-col gap-3">
      <div
        ref={ref}
        role="grid"
        aria-label={label}
        aria-rowcount={model.rows.length + 1}
        aria-colcount={columns + 1}
        aria-activedescendant={active === undefined ? undefined : cellId(row, column)}
        tabIndex={0}
        onKeyDown={cursor.onKeyDown}
        onFocus={cursor.onFocus}
        onBlur={cursor.onBlur}
        onPointerLeave={cursor.onBlur}
        className="relative grid rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        style={{ gridTemplateColumns: `${String(LABEL_WIDTH)}px repeat(${String(columns)}, minmax(0, 1fr))`, gap: GAP }}
      >
        <HeatmapHeader hours={model.hours} everyHours={widthCell >= 34 ? 1 : 2} />
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
                  cursor.setActive(r * columns + c)
                }}
              />
            ))}
          </div>
        ))}
        {active === undefined ? null : (
          <ChartTooltip
            x={LABEL_WIDTH + (column + 0.5) * (widthCell + GAP)}
            y={HEADER_HEIGHT + GAP + row * (CELL_HEIGHT + GAP)}
            containerWidth={width}
            {...describe(active)}
          />
        )}
      </div>
      <HeatmapLegend max={model.max} unit="pedidos" />
    </div>
  )
}
