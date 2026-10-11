import type { AreaGeometry } from './areaGeometry'
import { SERIES_COLOR } from './seriesColor'

interface AreaCursorMarkerProps {
  readonly geometry: AreaGeometry
  readonly index: number
  readonly value: number
}

/** Cruz vertical y punto del dato bajo el cursor. */
export function AreaCursorMarker({ geometry, index, value }: AreaCursorMarkerProps) {
  const { x, y, plotTop, plotBottom } = geometry
  return (
    <g aria-hidden data-testid="area-cursor">
      <line x1={x(index)} x2={x(index)} y1={plotTop} y2={plotBottom} stroke="var(--muted-foreground)" strokeWidth={1} />
      <circle cx={x(index)} cy={y(value)} r={5} fill={SERIES_COLOR} stroke="var(--card)" strokeWidth={2} />
    </g>
  )
}
