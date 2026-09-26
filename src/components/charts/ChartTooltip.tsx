import type { ReactNode } from 'react'

export interface TooltipRow {
  readonly label: string
  readonly value: string
  /** Color de la marca de la serie: una raya corta, nunca el color del texto. */
  readonly swatch?: string
}

interface ChartTooltipProps {
  /** Posición del ancla dentro del contenedor del gráfico, en píxeles. */
  readonly x: number
  readonly y: number
  readonly containerWidth: number
  readonly title: ReactNode
  readonly rows: readonly TooltipRow[]
}

const TOOLTIP_WIDTH = 208
const OFFSET = 12

/**
 * La lectura de un punto al pasar el mouse o enfocar con el teclado.
 *
 * Nunca es la única forma de ver el dato: la vista de tabla de cada gráfico
 * tiene los mismos valores. El valor va primero y fuerte; la etiqueta,
 * después y apagada, porque quien mira ya sabe qué serie es.
 */
export default function ChartTooltip({ x, y, containerWidth, title, rows }: ChartTooltipProps) {
  // Se abre hacia el lado con espacio para no salirse de la tarjeta.
  const haciaIzquierda = x + OFFSET + TOOLTIP_WIDTH > containerWidth
  const left = haciaIzquierda ? Math.max(0, x - OFFSET - TOOLTIP_WIDTH) : x + OFFSET

  return (
    <div
      role="status"
      className="pointer-events-none absolute z-10 flex flex-col gap-1.5 rounded-lg border bg-popover px-3 py-2 text-popover-foreground shadow-md"
      style={{ left, top: Math.max(0, y - OFFSET), width: TOOLTIP_WIDTH }}
    >
      <p className="m-0 text-xs text-muted-foreground">{title}</p>
      {rows.map((row) => (
        <p key={row.label} className="m-0 flex items-center gap-2 text-xs">
          {row.swatch === undefined ? null : (
            <span aria-hidden className="h-0.5 w-3 rounded-full" style={{ background: row.swatch }} />
          )}
          <strong className="text-sm font-semibold tabular-nums">{row.value}</strong>
          <span className="text-muted-foreground">{row.label}</span>
        </p>
      ))}
    </div>
  )
}
