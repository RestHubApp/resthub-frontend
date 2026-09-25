import { HEAT_STEPS, heatColor } from './heatmapModel'

interface HeatmapLegendProps {
  readonly max: number
  readonly unit: string
}

const SWATCH = 'inline-block h-3 w-5 rounded-[3px]'

/** La escala del mapa de calor: de menos a más, y aparte el cero. */
export default function HeatmapLegend({ max, unit }: HeatmapLegendProps) {
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
      <span className="flex items-center gap-1.5">
        <span>Menos</span>
        <span className="flex gap-0.5" aria-hidden>
          {Array.from({ length: HEAT_STEPS }, (_, indice) => (
            <span key={indice} className={SWATCH} style={{ background: heatColor(indice + 1) }} />
          ))}
        </span>
        <span>Más (hasta {max} {unit})</span>
      </span>
      <span className="flex items-center gap-1.5">
        <span className={`${SWATCH} ring-1 ring-foreground/10`} style={{ background: heatColor(0) }} aria-hidden />
        <span>Sin pedidos</span>
      </span>
    </div>
  )
}
