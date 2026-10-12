import type { AreaGeometry } from './areaGeometry'
import { SERIES_COLOR } from './seriesColor'

interface AreaMaxMarkerProps {
  readonly geometry: AreaGeometry
  readonly value: number
  readonly formatValue: (value: number) => string
}

/** Punto y rótulo «Máx.» sobre el valor más alto de la serie. */
export function AreaMaxMarker({ geometry, value, formatValue }: AreaMaxMarkerProps) {
  const { x, y, maxIndex } = geometry
  return (
    <g aria-hidden>
      <circle cx={x(maxIndex)} cy={y(value)} r={4} fill={SERIES_COLOR} stroke="var(--card)" strokeWidth={2} />
      <text
        x={Math.min(Math.max(x(maxIndex), geometry.plotLeft + 48), geometry.plotRight - 48)}
        y={y(value) - 10}
        textAnchor="middle"
        className="fill-foreground text-2xs font-medium tabular-nums"
      >
        {`Máx. ${formatValue(value)}`}
      </text>
    </g>
  )
}
