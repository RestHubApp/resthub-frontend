import type { OrderResponse } from '@/api/types'
import { ItemNote } from './ItemNote'
import type { FlagFor } from './noteFlags'
import { OrderItemLine } from './OrderItemLine'

interface OrderItemListProps {
  readonly order: OrderResponse
  readonly flagFor: FlagFor
  /** `large` para la cocina (se lee a distancia); `compact` para el tablero. */
  readonly size: 'compact' | 'large'
}

/** Los platos de un pedido, con sus notas, y la nota del pedido debajo. */
export function OrderItemList({ order, flagFor, size }: OrderItemListProps) {
  return (
    <>
      <ul
        className={`m-0 flex list-none flex-col border-t px-0 pt-3 pb-0 ${size === 'large' ? 'gap-2 text-base' : 'gap-1.5 text-sm'}`}
      >
        {order.items.map((item) => (
          <OrderItemLine key={item.id} item={item} flag={flagFor(order.id, item.id)} />
        ))}
      </ul>
      <ItemNote note={order.notes} flag={flagFor(order.id, null)} label="Nota del pedido" />
    </>
  )
}
