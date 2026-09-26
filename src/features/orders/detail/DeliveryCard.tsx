import type { OrderResponse } from '../../../api/types'
import Icon from '../../../components/Icon'

interface DeliveryCardProps {
  readonly order: OrderResponse
}

/** A dónde va un delivery y a qué número llamar. Nada si no es delivery. */
export default function DeliveryCard({ order }: DeliveryCardProps) {
  if (order.type !== 'delivery') {
    return null
  }
  return (
    <section aria-label="Entrega" className="flex flex-col gap-2 rounded-lg bg-card p-4 ring-1 ring-foreground/10">
      <p className="m-0 flex items-start gap-2 font-medium">
        <Icon name="ubicacion" size={18} />
        <span>
          {order.delivery_address}
          {order.delivery_reference === '' ? null : (
            <span className="block text-sm font-normal text-muted-foreground">Ref.: {order.delivery_reference}</span>
          )}
        </span>
      </p>
      {order.customer_phone === '' ? null : (
        <a href={`tel:${order.customer_phone}`} className="flex min-h-11 items-center gap-2 text-primary underline-offset-4 hover:underline">
          <Icon name="telefono" size={18} />
          <span>{order.customer_phone}</span>
        </a>
      )}
    </section>
  )
}
