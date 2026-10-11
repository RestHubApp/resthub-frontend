import { AreaCursorMarker } from './AreaCursorMarker'
import type { AreaGeometry, SeriesPoint } from './areaGeometry'
import { AreaMaxMarker } from './AreaMaxMarker'
import { SERIES_COLOR } from './seriesColor'

interface AreaSeriesMarksProps {
  readonly geometry: AreaGeometry
  readonly points: readonly SeriesPoint[]
  readonly overlayColor: string
  readonly formatValue: (value: number) => string
  /** Índice del punto bajo el cursor, o `null` si no hay. */
  readonly activeIndex: number | null
}

/** Lo que se dibuja dentro del SVG del gráfico de área: lavado, líneas, máximo y cursor. */
export function AreaSeriesMarks({ geometry, points, overlayColor, formatValue, activeIndex }: AreaSeriesMarksProps) {
  const max = points[geometry.maxIndex]
  const active = activeIndex === null ? undefined : points[activeIndex]
  return (
    <>
      <path d={geometry.areaPath} fill="var(--chart-area)" />
      <path d={geometry.linePath} fill="none" stroke={SERIES_COLOR} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
      <path d={geometry.overlayPath} fill="none" stroke={overlayColor} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
      {max === undefined || max.value <= 0 ? null : (
        <AreaMaxMarker geometry={geometry} value={max.value} formatValue={formatValue} />
      )}
      {active === undefined || activeIndex === null ? null : (
        <AreaCursorMarker geometry={geometry} index={activeIndex} value={active.value} />
      )}
    </>
  )
}
