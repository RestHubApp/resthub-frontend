import { type FocusEvent, type PointerEvent, type ReactNode, useRef, useState } from 'react'

import { ChartTooltip, type TooltipRow } from './ChartTooltip'

interface BarDatum {
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
export function BarList({ data, label }: BarListProps) {
  const listRef = useRef<HTMLDivElement>(null)
  const [anchor, setAnchor] = useState<Anchor | null>(null)
  const max = Math.max(0, ...data.map((datum) => datum.value))
  const reservation = Math.max(0, ...data.map((datum) => datum.valueLabel.length)) * REM_PER_CHAR + REM_GAP
  const [width, setWidth] = useState(0)

  const point = (index: number) => (event: PointerEvent<HTMLLIElement> | FocusEvent<HTMLLIElement>) => {
    const cashRegister = listRef.current?.getBoundingClientRect()
    const row = event.currentTarget.getBoundingClientRect()
    if (cashRegister === undefined) {
      return
    }
    setWidth(cashRegister.width)
    setAnchor({ index, x: row.left - cashRegister.left + row.width * 0.55, y: row.top - cashRegister.top })
  }
  const drop = () => {
    setAnchor(null)
  }
  const active = anchor === null ? undefined : data[anchor.index]

  return (
    <div ref={listRef} className="relative">
      <ul aria-label={label} className="m-0 flex list-none flex-col gap-1 p-0">
        {data.map((datum, index) => (
          // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- Fila de grafico enfocable: el foco muestra el tooltip con el valor para quien usa teclado; no hay accion que justifique un boton.
          <li
            key={datum.key}
            // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- El foco muestra el tooltip del dato (ver arriba).
            tabIndex={0}
            aria-label={`${datum.label}: ${datum.valueLabel}`}
            onPointerEnter={point(index)}
            onPointerLeave={drop}
            onFocus={point(index)}
            onBlur={drop}
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
                  width: `calc((100% - ${String(reservation)}rem) * ${String(max > 0 ? datum.value / max : 0)})`,
                  minWidth: datum.value > 0 ? 2 : 0,
                  background: TONES[datum.tone ?? 'series'],
                }}
              />
              <span className="text-sm font-medium whitespace-nowrap tabular-nums">{datum.valueLabel}</span>
            </span>
          </li>
        ))}
      </ul>
      {active === undefined || anchor === null || active.details === undefined ? null : (
        <ChartTooltip
          x={anchor.x}
          y={anchor.y}
          containerWidth={width}
          title={active.label}
          rows={active.details}
        />
      )}
    </div>
  )
}
