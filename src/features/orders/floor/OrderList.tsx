import type { OrderResponse } from '../../../api/types'
import OrderListItem from './OrderListItem'

interface OrderListProps {
  readonly title: string
  readonly orders: readonly OrderResponse[]
}

/** Una lista titulada de pedidos. Vacia, no se muestra. */
export default function OrderList({ title, orders }: OrderListProps) {
  if (orders.length === 0) {
    return null
  }
  return (
    <section className="flex flex-col gap-2">
      <h2 className="m-0 text-sm font-semibold text-muted-foreground">
        {title} ({orders.length})
      </h2>
      <ul className="m-0 flex list-none flex-col gap-2 p-0">
        {orders.map((order) => (
          <li key={order.id}>
            <OrderListItem order={order} />
          </li>
        ))}
      </ul>
    </section>
  )
}
