import type { FocusEvent, PointerEvent, ReactNode } from 'react'

import { BarContent } from './BarContent'
import type { TooltipRow } from './ChartTooltip'

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

export type RowEvent = PointerEvent<HTMLButtonElement> | FocusEvent<HTMLButtonElement>

interface BarRowProps {
  readonly datum: BarDatum
  /** El valor más alto de la serie: la barra más larga. */
  readonly max: number
  /** Ancho en rem que se deja libre a la derecha para el valor escrito. */
  readonly reservation: number
  /** Avisa que la fila se señaló con el mouse o con el foco. */
  readonly onPoint: (event: RowEvent) => void
  /** Avisa que la fila dejó de señalarse. */
  readonly onDrop: () => void
}

const ROW_CLASSES = 'grid w-full grid-cols-[minmax(7rem,38%)_1fr] items-center gap-3 rounded-md px-1 py-1.5 text-left'

/**
 * Una fila de `BarList`. Si trae detalle, la fila es un botón: es la forma
 * nativa de recibir el foco, y el foco muestra el mismo tooltip que el mouse
 * para quien usa teclado. Sin detalle no hay nada que mostrar y no se enfoca.
 */
export function BarRow({ datum, max, reservation, onPoint, onDrop }: BarRowProps) {
  const reading = `${datum.label}: ${datum.valueLabel}`
  if (datum.details === undefined) {
    return (
      <li aria-label={reading} className={`${ROW_CLASSES} hover:bg-muted/60`}>
        <BarContent datum={datum} max={max} reservation={reservation} />
      </li>
    )
  }
  return (
    <li>
      <button
        type="button"
        aria-label={reading}
        onPointerEnter={onPoint}
        onPointerLeave={onDrop}
        onFocus={onPoint}
        onBlur={onDrop}
        className={`${ROW_CLASSES} cursor-default outline-none hover:bg-muted/60 focus-visible:ring-3 focus-visible:ring-ring/50`}
      >
        <BarContent datum={datum} max={max} reservation={reservation} />
      </button>
    </li>
  )
}
