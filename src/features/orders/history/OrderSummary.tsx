import type { OrderResponse } from '../../../api/types'
import OrderClosedInfo from '../detail/OrderClosedInfo'
import OrderItemLine from '../OrderItemLine'

interface OrderSummaryProps {
  readonly order: OrderResponse
}

/** El detalle de un pedido dentro del historial: platos y como termino. */
export default function OrderSummary({ order }: OrderSummaryProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <ul className="m-0 flex list-none flex-col gap-2 p-0">
        {order.items.map((item) => (
          <OrderItemLine key={item.id} item={item} showPrice />
        ))}
      </ul>
      <div className="flex flex-col gap-2">
        <OrderClosedInfo order={order} />
        {order.notes === '' ? null : <p className="m-0 text-sm">Nota: {order.notes}</p>}
      </div>
    </div>
  )
}
