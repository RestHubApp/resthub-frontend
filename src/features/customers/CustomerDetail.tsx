import { Link } from 'react-router'

import type { Customer } from '@/api/types'
import { StatusBadge } from '@/components/StatusBadge'
import { Button } from '@/components/ui/button'
import { formatDateTime, formatMoney } from '@/services/format'
import { paths } from '@/services/paths'

interface CustomerDetailProps {
  readonly customer: Customer
  readonly timeZone: string
  readonly canEdit: boolean
  readonly onEdit: () => void
}

/** Las cifras de un cliente, su dirección, sus notas y sus últimos pedidos. */
// El tipo de pedido con el mismo nombre que usan el tablero y el historial.
// El API manda el tipo como texto libre: uno que no está en la lista se muestra tal cual.
const TYPES: Partial<Record<string, string>> = {
  dine_in: 'En mesa',
  takeaway: 'Para llevar',
  delivery: 'Delivery',
}

export function CustomerDetail({ customer, timeZone, canEdit, onEdit }: CustomerDetailProps) {
  const figures = [
    { label: 'Visitas', value: String(customer.visits) },
    { label: 'Gastado', value: formatMoney(customer.spent) },
    { label: 'Ticket prom.', value: formatMoney(customer.average_ticket) },
  ]
  const address = [customer.address, customer.reference === '' ? '' : `Ref.: ${customer.reference}`].filter(
    (data) => data !== '',
  )

  return (
    <>
      <dl className="m-0 grid grid-cols-3 gap-3 text-center">
        {figures.map((figure) => (
          <div key={figure.label}>
            <dt className="text-xs text-muted-foreground">{figure.label}</dt>
            <dd className="m-0 text-lg font-bold tabular-nums">{figure.value}</dd>
          </div>
        ))}
      </dl>
      {customer.is_frequent ? <StatusBadge label="Cliente frecuente" tone="completed" /> : null}
      {/* Guardado antes de pedir el consentimiento: al editarlo se puede anotar. */}
      {customer.consent_at === null ? <StatusBadge label="Sin consentimiento registrado" tone="pending" /> : null}
      {address.length > 0 ? <p className="m-0 text-sm">{address.join(' · ')}</p> : null}
      {customer.notes === '' ? null : <p className="m-0 rounded-md bg-muted p-3 text-sm">{customer.notes}</p>}
      <h3 className="m-0 text-sm font-semibold">Últimos pedidos</h3>
      {customer.recent_orders.length === 0 ? <p className="m-0 text-sm text-muted-foreground">Todavía no pidió.</p> : null}
      <ul className="m-0 flex list-none flex-col gap-1 p-0">
        {customer.recent_orders.map((order) => (
          <li key={order.order_id}>
            <Link
              to={paths.orders.detail(order.order_id)}
              className="flex min-h-11 items-center justify-between gap-2 rounded-md px-2 hover:bg-muted"
            >
              <span>
                #{order.number} · {TYPES[order.type] ?? order.type}
              </span>
              <span className="text-sm text-muted-foreground">
                {formatMoney(order.total)} · {formatDateTime(order.created_at, timeZone)}
              </span>
            </Link>
          </li>
        ))}
      </ul>
      {canEdit ? (
        <Button type="button" variant="outline" size="lg" className="h-11" onClick={onEdit}>
          Editar datos
        </Button>
      ) : null}
    </>
  )
}
