import { niceTicks } from './scale'

export interface SeriesPoint {
  readonly key: string
  /** Lo que dice el eje horizontal bajo el punto. */
  readonly axisLabel: string
  readonly value: number
}

export const AREA_MARGIN = { top: 28, right: 16, bottom: 28, left: 64 } as const

export interface AreaGeometry {
  readonly ticks: readonly number[]
  readonly plotLeft: number
  readonly plotRight: number
  readonly plotTop: number
  readonly plotBottom: number
  readonly step: number
  readonly x: (index: number) => number
  readonly y: (value: number) => number
  readonly linePath: string
  readonly areaPath: string
  /** La línea de la serie superpuesta; vacía si no hay. */
  readonly overlayPath: string
  readonly maxIndex: number
}

function pathOf(values: readonly number[], x: (index: number) => number, y: (value: number) => number): string {
  return values
    .map((value, index) => `${index === 0 ? 'M' : 'L'}${x(index).toFixed(1)},${y(value).toFixed(1)}`)
    .join(' ')
}

/**
 * Las coordenadas de una serie en el tamaño disponible, con el cero abajo.
 *
 * `overlay` es una segunda serie de la misma unidad (los errores dentro de las
 * peticiones): comparte el eje, así que el tope cubre a las dos.
 */
export function areaGeometry(
  points: readonly SeriesPoint[],
  width: number,
  height: number,
  overlay: readonly number[] = [],
): AreaGeometry {
  const plotLeft = AREA_MARGIN.left
  const plotRight = Math.max(plotLeft + 1, width - AREA_MARGIN.right)
  const plotTop = AREA_MARGIN.top
  const plotBottom = height - AREA_MARGIN.bottom
  const maximo = Math.max(0, ...points.map((point) => point.value), ...overlay)
  const ticks = niceTicks(maximo)
  const tope = ticks.at(-1) ?? 1
  const step = points.length > 1 ? (plotRight - plotLeft) / (points.length - 1) : 0

  const x = (index: number) => plotLeft + index * step
  const y = (value: number) => plotBottom - (value / tope) * (plotBottom - plotTop)

  const linePath = pathOf(
    points.map((point) => point.value),
    x,
    y,
  )
  const areaPath =
    points.length === 0
      ? ''
      : `${linePath} L${x(points.length - 1).toFixed(1)},${String(plotBottom)} L${String(plotLeft)},${String(plotBottom)} Z`
  const maxIndex = points.reduce(
    (mejor, point, index) => (point.value > (points[mejor]?.value ?? 0) ? index : mejor),
    0,
  )

  return {
    ticks,
    plotLeft,
    plotRight,
    plotTop,
    plotBottom,
    step,
    x,
    y,
    linePath,
    areaPath,
    overlayPath: pathOf(overlay, x, y),
    maxIndex,
  }
}
