import { type AreaGeometry, type SeriesPoint } from './areaGeometry'
import { spreadIndices } from './scale'

interface AreaAxesProps {
  readonly geometry: AreaGeometry
  readonly points: readonly SeriesPoint[]
  readonly formatTick: (value: number) => string
  /** Cuántas fechas caben debajo sin pisarse. */
  readonly maxXLabels: number
}

const TICK_TEXT = 'fill-muted-foreground text-[11px] tabular-nums'

// Las fechas de los extremos se alinean hacia adentro para no salirse del SVG.
function anchorFor(index: number, length: number): 'start' | 'middle' | 'end' {
  if (index === 0) {
    return 'start'
  }
  return index === length - 1 ? 'end' : 'middle'
}

/** La grilla horizontal, las marcas del eje de valores y las fechas de abajo. */
export default function AreaAxes({ geometry, points, formatTick, maxXLabels }: AreaAxesProps) {
  const { ticks, plotLeft, plotRight, plotBottom, x, y } = geometry

  return (
    <g aria-hidden>
      {ticks.map((tick) => (
        <g key={tick}>
          <line
            x1={plotLeft}
            x2={plotRight}
            y1={y(tick)}
            y2={y(tick)}
            stroke={tick === 0 ? 'var(--chart-axis)' : 'var(--chart-grid)'}
            strokeWidth={1}
            shapeRendering="crispEdges"
          />
          <text x={plotLeft - 8} y={y(tick)} dy="0.32em" textAnchor="end" className={TICK_TEXT}>
            {formatTick(tick)}
          </text>
        </g>
      ))}
      {spreadIndices(points.length, maxXLabels).map((index) => (
        <text
          key={points[index]?.key}
          x={x(index)}
          y={plotBottom + 18}
          textAnchor={anchorFor(index, points.length)}
          className={TICK_TEXT}
        >
          {points[index]?.axisLabel}
        </text>
      ))}
    </g>
  )
}
