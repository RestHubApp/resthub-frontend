import { Link } from 'react-router'

import type { Customer } from '../../api/types'
import StatusBadge from '../../components/StatusBadge'
import { Button } from '../../components/ui/button'
import { formatDateTime, formatMoney } from '../../services/format'

interface CustomerDetailProps {
  readonly customer: Customer
  readonly timeZone: string
  readonly canEdit: boolean
  readonly onEdit: () => void
}

/** Las cifras de un cliente, su dirección, sus notas y sus últimos pedidos. */
export default function CustomerDetail({ customer, timeZone, canEdit, onEdit }: CustomerDetailProps) {
  const cifras = [
    { label: 'Visitas', value: String(customer.visits) },
    { label: 'Gastado', value: formatMoney(customer.spent) },
    { label: 'Ticket prom.', value: formatMoney(customer.average_ticket) },
  ]
  const direccion = [customer.address, customer.reference === '' ? '' : `Ref.: ${customer.reference}`].filter(
    (dato) => dato !== '',
  )

  return (
    <>
      <dl className="m-0 grid grid-cols-3 gap-3 text-center">
        {cifras.map((cifra) => (
          <div key={cifra.label}>
            <dt className="text-xs text-muted-foreground">{cifra.label}</dt>
            <dd className="m-0 text-lg font-bold tabular-nums">{cifra.value}</dd>
          </div>
        ))}
      </dl>
      {customer.is_frequent ? <StatusBadge label="Cliente frecuente" tone="completed" /> : null}
      {direccion.length > 0 ? <p className="m-0 text-sm">{direccion.join(' · ')}</p> : null}
      {customer.notes === '' ? null : <p className="m-0 rounded-md bg-muted p-3 text-sm">{customer.notes}</p>}
      <h3 className="m-0 text-sm font-semibold">Últimos pedidos</h3>
      {customer.recent_orders.length === 0 ? <p className="m-0 text-sm text-muted-foreground">Todavía no pidió.</p> : null}
      <ul className="m-0 flex list-none flex-col gap-1 p-0">
        {customer.recent_orders.map((pedido) => (
          <li key={pedido.order_id}>
            <Link
              to={`/pedidos/${String(pedido.order_id)}`}
              className="flex min-h-11 items-center justify-between gap-2 rounded-md px-2 hover:bg-muted"
            >
              <span>
                #{pedido.number} · {pedido.type}
              </span>
              <span className="text-sm text-muted-foreground">
                {formatMoney(pedido.total)} · {formatDateTime(pedido.created_at, timeZone)}
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
