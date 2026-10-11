import { useId } from 'react'

import type { HourlyCell } from '@/api/types'
import { ChartTooltip, type TooltipRow } from '@/components/charts/ChartTooltip'
import { useElementWidth } from '@/components/charts/useElementWidth'
import { HeatmapHeader } from './HeatmapHeader'
import { HeatmapLegend } from './HeatmapLegend'
import { CELL_HEIGHT, heatmapModel } from './heatmapModel'
import { HeatmapRows } from './HeatmapRows'
import { useHeatmapCursor } from './useHeatmapCursor'

interface HeatmapProps {
  readonly cells: readonly HourlyCell[]
  readonly peak: HourlyCell | null
  readonly label: string
  readonly describe: (cell: HourlyCell) => { title: string; rows: readonly TooltipRow[] }
}

const LABEL_WIDTH = 44
const GAP = 2
const HEADER_HEIGHT = 20

/**
 * Pedidos por día de la semana y hora: una rampa de un solo tono, más oscuro
 * es más. El cero va en gris para no confundirse con "poco". El pico lleva un
 * anillo, además del color, y su lectura escrita arriba.
 */
export function Heatmap({ cells, peak, label, describe }: HeatmapProps) {
  const [ref, width] = useElementWidth<HTMLDivElement>()
  const idPrefix = useId()
  const model = heatmapModel(cells)
  const { cursor, columns, row, column, active } = useHeatmapCursor(model)
  const widthCell = columns === 0 ? 0 : (width - LABEL_WIDTH - GAP * columns) / columns
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
        <HeatmapRows
          model={model}
          peak={peak}
          active={active}
          describe={describe}
          cellId={cellId}
          onPoint={cursor.setActive}
        />
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
