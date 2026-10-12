import { useRef, useState } from 'react'

import { type BarDatum, BarRow, type RowEvent } from './BarRow'
import { ChartTooltip } from './ChartTooltip'

interface BarListProps {
  readonly data: readonly BarDatum[]
  readonly label: string
}

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

  const point = (index: number) => (event: RowEvent) => {
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
          <BarRow key={datum.key} datum={datum} max={max} reservation={reservation} onPoint={point(index)} onDrop={drop} />
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
