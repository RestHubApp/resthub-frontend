import type { PointerEvent } from 'react'

import { AreaAxes } from './AreaAxes'
import { AREA_MARGIN, areaGeometry, type SeriesPoint } from './areaGeometry'
import { AreaSeriesMarks } from './AreaSeriesMarks'
import { ChartTooltip, type TooltipRow } from './ChartTooltip'
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
  /** Una segunda serie de la misma unidad, como línea sin lavado sobre la primera. */
  readonly overlay?: AreaOverlay
}

interface AreaOverlay {
  /** Un valor por punto de `points`, en el mismo orden. */
  readonly values: readonly number[]
  readonly color: string
}

const HEIGHT = 260
const PIXELS_PER_LABEL = 84
// Sin segunda serie, su línea queda vacía.
const NO_OVERLAY: AreaOverlay = { values: [], color: 'none' }

/** El punto más cercano al puntero dentro del SVG. */
function pointerIndex(event: PointerEvent<SVGSVGElement>, step: number, length: number): number {
  const box = event.currentTarget.getBoundingClientRect()
  return nearestIndex({ x: event.clientX - box.left, left: AREA_MARGIN.left, step, length })
}

/**
 * Una serie en el tiempo: línea de 2 px sobre un lavado del 10 %, y a veces
 * una segunda serie de la misma unidad como línea sola, en otro color.
 *
 * Un solo eje, desde cero. La cruz vertical sigue al puntero y se engancha al
 * punto más cercano, así nadie tiene que apuntar a una línea de 2 px. Solo el
 * máximo lleva rótulo; el resto está en el eje, la lectura y la tabla.
 */
export function AreaChart({ points, label, formatValue, formatTick, describe, overlay = NO_OVERLAY }: AreaChartProps) {
  const [ref, width] = useElementWidth<HTMLDivElement>()
  const cursor = useChartCursor(points.length)
  const geometry = areaGeometry(points, { width, height: HEIGHT }, overlay.values)
  const maxXLabels = Math.max(2, Math.floor(width / PIXELS_PER_LABEL))
  const active = cursor.active === null ? undefined : points[cursor.active]

  const onPointerMove = (event: PointerEvent<SVGSVGElement>) => {
    cursor.setActive(pointerIndex(event, geometry.step, points.length))
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
          <AreaAxes geometry={geometry} points={points} formatTick={formatTick} maxXLabels={maxXLabels} />
          <AreaSeriesMarks
            geometry={geometry}
            points={points}
            overlayColor={overlay.color}
            formatValue={formatValue}
            activeIndex={cursor.active}
          />
        </svg>
      ) : (
        <div style={{ height: HEIGHT }} />
      )}
      {active === undefined || cursor.active === null ? null : (
        <ChartTooltip
          x={geometry.x(cursor.active)}
          y={geometry.y(active.value)}
          containerWidth={width}
          {...describe(cursor.active)}
        />
      )}
    </div>
  )
}
