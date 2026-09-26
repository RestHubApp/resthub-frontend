import type { Customer } from '../../api/types'
import StatusBadge from '../../components/StatusBadge'
import { formatMoney } from '../../services/format'

interface CustomerRowProps {
  readonly customer: Customer
  readonly onOpen: () => void
}

function visitas(count: number): string {
  return count === 1 ? '1 visita' : `${String(count)} visitas`
}

/** Un cliente en la lista: nombre, contacto, visitas y gasto. */
export default function CustomerRow({ customer, onOpen }: CustomerRowProps) {
  return (
    <li>
      <button
        type="button"
        className="flex min-h-14 w-full flex-wrap items-center justify-between gap-2 rounded-lg px-3 py-2 text-left ring-1 ring-input hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
        onClick={onOpen}
      >
        <span className="flex flex-col">
          <span className="flex items-center gap-2 font-medium">
            {customer.name}
            {customer.is_frequent ? <StatusBadge label="Frecuente" tone="completed" /> : null}
          </span>
          <span className="text-xs text-muted-foreground">{customer.phone === '' ? 'Sin teléfono' : customer.phone}</span>
        </span>
        <span className="text-sm text-muted-foreground tabular-nums">
          {visitas(customer.visits)} · {formatMoney(customer.spent)}
        </span>
      </button>
    </li>
  )
}
