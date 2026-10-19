import type { Customer } from '@/api/types'
import { StatusBadge } from '@/components/StatusBadge'
import { Button } from '@/components/ui/button'
import { formatMoney } from '@/services/format'
import { CustomerConsentRequest } from './CustomerConsentRequest'
import { CustomerRecentOrders } from './CustomerRecentOrders'

interface CustomerDetailProps {
  readonly customer: Customer
  readonly timeZone: string
  readonly canEdit: boolean
  readonly onEdit: () => void
}

/**
 * Las cifras de un cliente, su dirección, sus notas y sus últimos pedidos; si se
 * guardó antes de pedirle el consentimiento, la casilla para anotarlo.
 */
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
      {/* Guardado antes de pedir el consentimiento: la ficha ofrece la casilla para anotarlo. */}
      {customer.consent_at === null ? <StatusBadge label="Sin consentimiento registrado" tone="pending" /> : null}
      {address.length > 0 ? <p className="m-0 text-sm">{address.join(' · ')}</p> : null}
      {customer.notes === '' ? null : <p className="m-0 rounded-md bg-muted p-3 text-sm">{customer.notes}</p>}
      <CustomerRecentOrders orders={customer.recent_orders} timeZone={timeZone} />
      {canEdit ? (
        <>
          <Button type="button" variant="outline" onClick={onEdit}>
            Editar datos
          </Button>
          <CustomerConsentRequest customer={customer} />
        </>
      ) : null}
    </>
  )
}
