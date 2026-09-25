import type { OrderType } from '../../../api/types'

export type TypeFilterValue = OrderType | 'all'

interface TypeFilterProps {
  readonly value: TypeFilterValue
  readonly counts: Readonly<Record<TypeFilterValue, number>>
  readonly onChange: (value: TypeFilterValue) => void
}

const OPCIONES: readonly { value: TypeFilterValue; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'dine_in', label: 'En mesa' },
  { value: 'takeaway', label: 'Para llevar' },
]

const CHIP =
  'min-h-11 rounded-full px-4 text-sm font-medium outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50'

/** Filtro rapido del tablero por tipo de pedido, con cuantos hay de cada uno. */
export default function TypeFilter({ value, counts, onChange }: TypeFilterProps) {
  return (
    <div role="group" aria-label="Filtrar por tipo" className="flex flex-wrap gap-2">
      {OPCIONES.map((opcion) => (
        <button
          key={opcion.value}
          type="button"
          aria-pressed={value === opcion.value}
          className={
            value === opcion.value
              ? `${CHIP} bg-primary text-primary-foreground`
              : `${CHIP} bg-card ring-1 ring-foreground/15 hover:bg-muted`
          }
          onClick={() => {
            onChange(opcion.value)
          }}
        >
          {opcion.label} <span className="tabular-nums">({counts[opcion.value]})</span>
        </button>
      ))}
    </div>
  )
}
