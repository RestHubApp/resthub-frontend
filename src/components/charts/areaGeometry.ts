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
  readonly maxIndex: number
}

/** Las coordenadas de una serie en el tamaño disponible, con el cero abajo. */
export function areaGeometry(points: readonly SeriesPoint[], width: number, height: number): AreaGeometry {
  const plotLeft = AREA_MARGIN.left
  const plotRight = Math.max(plotLeft + 1, width - AREA_MARGIN.right)
  const plotTop = AREA_MARGIN.top
  const plotBottom = height - AREA_MARGIN.bottom
  const maximo = Math.max(0, ...points.map((point) => point.value))
  const ticks = niceTicks(maximo)
  const tope = ticks.at(-1) ?? 1
  const step = points.length > 1 ? (plotRight - plotLeft) / (points.length - 1) : 0

  const x = (index: number) => plotLeft + index * step
  const y = (value: number) => plotBottom - (value / tope) * (plotBottom - plotTop)

  const linePath = points
    .map((point, index) => `${index === 0 ? 'M' : 'L'}${x(index).toFixed(1)},${y(point.value).toFixed(1)}`)
    .join(' ')
  const areaPath =
    points.length === 0
      ? ''
      : `${linePath} L${x(points.length - 1).toFixed(1)},${String(plotBottom)} L${String(plotLeft)},${String(plotBottom)} Z`
  const maxIndex = points.reduce(
    (mejor, point, index) => (point.value > (points[mejor]?.value ?? 0) ? index : mejor),
    0,
  )

  return { ticks, plotLeft, plotRight, plotTop, plotBottom, step, x, y, linePath, areaPath, maxIndex }
}
