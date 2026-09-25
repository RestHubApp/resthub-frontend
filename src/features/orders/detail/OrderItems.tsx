import type { OrderResponse } from '../../../api/types'
import SectionCard from '../../../components/SectionCard'
import type { FlagFor } from '../noteFlags'
import OrderItemLine from '../OrderItemLine'
import EditableItem from './EditableItem'

interface OrderItemsProps {
  readonly order: OrderResponse
  readonly flagFor: FlagFor
}

/** Los platos del pedido. Abierto, cada uno se puede cambiar o quitar. */
export default function OrderItems({ order, flagFor }: OrderItemsProps) {
  const editable = order.status === 'open'

  return (
    <SectionCard
      title="Platos"
      description={editable ? 'Todavía no está en cocina: puedes cambiar cantidades, notas o quitar platos.' : undefined}
    >
      {order.items.length === 0 ? (
        <p className="m-0 text-muted-foreground">Este pedido no tiene platos.</p>
      ) : (
        <ul className="m-0 flex list-none flex-col gap-3 p-0">
          {order.items.map((item) =>
            editable ? (
              <EditableItem key={item.id} orderId={order.id} item={item} flag={flagFor(order.id, item.id)} />
            ) : (
              <OrderItemLine key={item.id} item={item} showPrice flag={flagFor(order.id, item.id)} />
            ),
          )}
        </ul>
      )}
    </SectionCard>
  )
}
