import { type FocusEvent, type PointerEvent, type ReactNode, useRef, useState } from 'react'

import ChartTooltip, { type TooltipRow } from './ChartTooltip'

export interface BarDatum {
  readonly key: string
  readonly label: string
  readonly value: number
  /** El valor escrito en la punta de la barra. */
  readonly valueLabel: string
  /** `muted` es el gris de lo que no es la historia, como "Sin clasificar". */
  readonly tone?: 'series' | 'muted'
  /** Lo que agrega la lectura al pasar el mouse. */
  readonly details?: readonly TooltipRow[]
  /** Un aviso junto a la etiqueta, como el estado de un insumo. */
  readonly badge?: ReactNode
}

interface BarListProps {
  readonly data: readonly BarDatum[]
  readonly label: string
}

const TONES = { series: 'var(--chart-1)', muted: 'var(--muted-foreground)' } as const
// La barra más larga deja lugar a su valor escrito en la punta: se reserva
// el ancho del rótulo más largo (unos 0,55 rem por carácter en texto chico).
const REM_PER_CHAR = 0.55
const REM_GAP = 0.75

interface Anchor {
  readonly index: number
  readonly x: number
  readonly y: number
}

/**
 * Barras horizontales de una sola serie, de mayor a menor.
 *
 * Horizontales porque los nombres de platos e insumos son largos. Una serie
 * lleva un solo color (el primero de la paleta): pintar cada barra distinto
 * repetiría con el color lo que ya dice el largo.
 */
export default function BarList({ data, label }: BarListProps) {
  const listRef = useRef<HTMLDivElement>(null)
  const [anchor, setAnchor] = useState<Anchor | null>(null)
  const max = Math.max(0, ...data.map((datum) => datum.value))
  const reserva = Math.max(0, ...data.map((datum) => datum.valueLabel.length)) * REM_PER_CHAR + REM_GAP
  const [ancho, setAncho] = useState(0)

  const señalar = (index: number) => (event: PointerEvent<HTMLLIElement> | FocusEvent<HTMLLIElement>) => {
    const caja = listRef.current?.getBoundingClientRect()
    const fila = event.currentTarget.getBoundingClientRect()
    if (caja === undefined) {
      return
    }
    setAncho(caja.width)
    setAnchor({ index, x: fila.left - caja.left + fila.width * 0.55, y: fila.top - caja.top })
  }
  const soltar = () => {
    setAnchor(null)
  }
  const activo = anchor === null ? undefined : data[anchor.index]

  return (
    <div ref={listRef} className="relative">
      <ul aria-label={label} className="m-0 flex list-none flex-col gap-1 p-0">
        {data.map((datum, index) => (
          <li
            key={datum.key}
            tabIndex={0}
            aria-label={`${datum.label}: ${datum.valueLabel}`}
            onPointerEnter={señalar(index)}
            onPointerLeave={soltar}
            onFocus={señalar(index)}
            onBlur={soltar}
            className="grid grid-cols-[minmax(7rem,38%)_1fr] items-center gap-3 rounded-md px-1 py-1.5 outline-none hover:bg-muted/60 focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <span className="flex min-w-0 items-center gap-2 text-sm">
              <span className="truncate" title={datum.label}>
                {datum.label}
              </span>
              {datum.badge}
            </span>
            <span aria-hidden className="flex min-w-0 items-center gap-2">
              <span
                className="h-3.5 shrink-0 rounded-r-[4px]"
                style={{
                  width: `calc((100% - ${String(reserva)}rem) * ${String(max > 0 ? datum.value / max : 0)})`,
                  minWidth: datum.value > 0 ? 2 : 0,
                  background: TONES[datum.tone ?? 'series'],
                }}
              />
              <span className="text-sm font-medium whitespace-nowrap tabular-nums">{datum.valueLabel}</span>
            </span>
          </li>
        ))}
      </ul>
      {activo === undefined || anchor === null || activo.details === undefined ? null : (
        <ChartTooltip
          x={anchor.x}
          y={anchor.y}
          containerWidth={ancho}
          title={activo.label}
          rows={activo.details}
        />
      )}
    </div>
  )
}
