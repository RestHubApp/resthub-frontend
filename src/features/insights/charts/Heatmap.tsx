import type { HourlyCell } from '../../../api/types'
import ChartTooltip, { type TooltipRow } from './ChartTooltip'
import { heatColor, heatmapModel, heatStep } from './heatmapModel'
import HeatmapLegend from './HeatmapLegend'
import { useChartCursor } from './useChartCursor'
import { useElementWidth } from './useElementWidth'

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

function sameCell(a: HourlyCell, b: HourlyCell | null): boolean {
  return b !== null && a.weekday === b.weekday && a.hour === b.hour
}

/**
 * Pedidos por día de la semana y hora: una rampa de un solo tono, más oscuro
 * es más. El cero va en gris para no confundirse con "poco". El pico lleva un
 * anillo, además del color, y su lectura escrita arriba.
 */
export default function Heatmap({ cells, peak, label, describe }: HeatmapProps) {
  const [ref, width] = useElementWidth<HTMLDivElement>()
  const model = heatmapModel(cells)
  const columnas = model.hours.length
  const cursor = useChartCursor(model.rows.length * columnas, columnas)
  const anchoCelda = columnas === 0 ? 0 : (width - LABEL_WIDTH - GAP * columnas) / columnas
  const cadaCuanto = anchoCelda >= 34 ? 1 : 2

  const activa = cursor.active === null ? undefined : model.rows[Math.floor(cursor.active / columnas)]?.cells[cursor.active % columnas]
  const fila = cursor.active === null ? 0 : Math.floor(cursor.active / columnas)
  const columna = cursor.active === null ? 0 : cursor.active % columnas

  return (
    <div className="flex flex-col gap-3">
      <div
        ref={ref}
        role="img"
        aria-label={label}
        tabIndex={0}
        onKeyDown={cursor.onKeyDown}
        onFocus={cursor.onFocus}
        onBlur={cursor.onBlur}
        onPointerLeave={cursor.onBlur}
        className="relative grid rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        style={{ gridTemplateColumns: `${String(LABEL_WIDTH)}px repeat(${String(columnas)}, minmax(0, 1fr))`, gap: GAP }}
      >
        <span aria-hidden />
        {model.hours.map((hour, indice) => (
          <span key={hour} aria-hidden className="text-center text-[11px] leading-5 text-muted-foreground tabular-nums">
            {indice % cadaCuanto === 0 ? String(hour) : ''}
          </span>
        ))}
        {model.rows.map((row, r) => [
          <span key={`d${String(row.weekday)}`} aria-hidden className="text-xs leading-7 text-muted-foreground">
            {row.label.slice(0, 3)}
          </span>,
          ...row.cells.map((cell, c) => (
            <span
              key={`${String(cell.weekday)}-${String(cell.hour)}`}
              aria-hidden
              onPointerEnter={() => {
                cursor.setActive(r * columnas + c)
              }}
              className="rounded-[4px] transition-[filter] hover:brightness-110"
              style={{
                height: CELL_HEIGHT,
                background: heatColor(heatStep(cell.paid_orders, model.max)),
                boxShadow: sameCell(cell, peak) ? PEAK_RING : undefined,
              }}
            />
          )),
        ])}
        {activa === undefined ? null : (
          <ChartTooltip
            x={LABEL_WIDTH + (columna + 0.5) * (anchoCelda + GAP)}
            y={HEADER_HEIGHT + GAP + fila * (CELL_HEIGHT + GAP)}
            containerWidth={width}
            {...describe(activa)}
          />
        )}
      </div>
      <HeatmapLegend max={model.max} unit="pedidos" />
    </div>
  )
}
