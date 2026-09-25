import type { PointerEvent } from 'react'

import AreaAxes from './AreaAxes'
import { AREA_MARGIN, areaGeometry, type SeriesPoint } from './areaGeometry'
import ChartTooltip, { type TooltipRow } from './ChartTooltip'
import { nearestIndex } from './scale'
import { useChartCursor } from './useChartCursor'
import { useElementWidth } from './useElementWidth'

interface AreaChartProps {
  readonly points: readonly SeriesPoint[]
  /** Nombre accesible del gráfico: qué mide y en qué período. */
  readonly label: string
  readonly formatValue: (value: number) => string
  readonly formatTick: (value: number) => string
  readonly describe: (index: number) => { title: string; rows: readonly TooltipRow[] }
}

const HEIGHT = 260
const SERIES = 'var(--chart-1)'
const PIXELS_PER_LABEL = 84

/**
 * Una serie en el tiempo: línea de 2 px sobre un lavado del 10 %.
 *
 * Un solo eje, desde cero. La cruz vertical sigue al puntero y se engancha al
 * día más cercano, así nadie tiene que apuntar a una línea de 2 px. Solo el
 * máximo lleva rótulo; el resto está en el eje, la lectura y la tabla.
 */
export default function AreaChart({ points, label, formatValue, formatTick, describe }: AreaChartProps) {
  const [ref, width] = useElementWidth<HTMLDivElement>()
  const cursor = useChartCursor(points.length)
  const geometry = areaGeometry(points, width, HEIGHT)
  const { x, y, plotTop, plotBottom, maxIndex } = geometry
  const maximo = points[maxIndex]
  const activo = cursor.active === null ? undefined : points[cursor.active]

  const onPointerMove = (event: PointerEvent<SVGSVGElement>) => {
    const caja = event.currentTarget.getBoundingClientRect()
    cursor.setActive(nearestIndex(event.clientX - caja.left, AREA_MARGIN.left, geometry.step, points.length))
  }

  return (
    <div ref={ref} className="relative w-full">
      {width > 0 ? (
        <svg
          width={width}
          height={HEIGHT}
          role="img"
          aria-label={label}
          tabIndex={0}
          className="block touch-pan-y rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          onPointerMove={onPointerMove}
          onPointerLeave={cursor.onBlur}
          onKeyDown={cursor.onKeyDown}
          onFocus={cursor.onFocus}
          onBlur={cursor.onBlur}
        >
          <AreaAxes
            geometry={geometry}
            points={points}
            formatTick={formatTick}
            maxXLabels={Math.max(2, Math.floor(width / PIXELS_PER_LABEL))}
          />
          <path d={geometry.areaPath} fill="var(--chart-area)" />
          <path d={geometry.linePath} fill="none" stroke={SERIES} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
          {points.length === 0 || maximo.value <= 0 ? null : (
            <g aria-hidden>
              <circle cx={x(maxIndex)} cy={y(maximo.value)} r={4} fill={SERIES} stroke="var(--card)" strokeWidth={2} />
              <text
                x={Math.min(Math.max(x(maxIndex), geometry.plotLeft + 48), geometry.plotRight - 48)}
                y={y(maximo.value) - 10}
                textAnchor="middle"
                className="fill-foreground text-[11px] font-medium tabular-nums"
              >
                {`Máx. ${formatValue(maximo.value)}`}
              </text>
            </g>
          )}
          {activo === undefined || cursor.active === null ? null : (
            <g aria-hidden>
              <line x1={x(cursor.active)} x2={x(cursor.active)} y1={plotTop} y2={plotBottom} stroke="var(--muted-foreground)" strokeWidth={1} />
              <circle cx={x(cursor.active)} cy={y(activo.value)} r={5} fill={SERIES} stroke="var(--card)" strokeWidth={2} />
            </g>
          )}
        </svg>
      ) : (
        <div style={{ height: HEIGHT }} />
      )}
      {activo === undefined || cursor.active === null ? null : (
        <ChartTooltip
          x={x(cursor.active)}
          y={y(activo.value)}
          containerWidth={width}
          {...describe(cursor.active)}
        />
      )}
    </div>
  )
}
