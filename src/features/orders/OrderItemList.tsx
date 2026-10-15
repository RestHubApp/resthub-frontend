import type { OrderItemResponse, OrderResponse } from '@/api/types'
import { ItemNote } from './ItemNote'
import type { FlagFor } from './noteFlags'
import { OrderItemLine } from './OrderItemLine'
import { RoundGroups } from './RoundGroups'

interface OrderItemListProps {
  readonly order: OrderResponse
  readonly flagFor: FlagFor
  /** `large` para la cocina (se lee a distancia); `compact` para el tablero. */
  readonly size: 'compact' | 'large'
}

/** Los platos de un pedido, con sus notas y por ronda, y la nota del pedido debajo. */
export function OrderItemList({ order, flagFor, size }: OrderItemListProps) {
  const renderItems = (items: readonly OrderItemResponse[]) => (
    <ul className={`m-0 flex list-none flex-col p-0 ${size === 'large' ? 'gap-2 text-base' : 'gap-1.5 text-sm'}`}>
      {items.map((item) => (
        <OrderItemLine key={item.id} item={item} flag={flagFor(order.id, item.id)} />
      ))}
    </ul>
  )

  return (
    <>
      <div className="border-t pt-3">
        <RoundGroups order={order} renderItems={renderItems} />
      </div>
      <ItemNote note={order.notes} flag={flagFor(order.id, null)} label="Nota del pedido" />
    </>
  )
}
