import type { OrderItemResponse, OrderResponse } from '@/api/types'
import { isVoided } from '@/features/orders/kitchenRounds'
import type { FlagFor } from '@/features/orders/noteFlags'
import { OrderItemLine } from '@/features/orders/OrderItemLine'
import { EditableItem } from './EditableItem'
import { VoidItemButton } from './VoidItemButton'

interface OrderItemRowsProps {
  readonly order: OrderResponse
  readonly items: readonly OrderItemResponse[]
  readonly flagFor: FlagFor
  /** Si se puede anular un plato de este pedido (permiso y estado). */
  readonly canVoid: boolean
  readonly onVoid: (item: OrderItemResponse) => void
}

/** Una lista de platos del detalle: editables mientras el pedido está abierto; después, con «Anular». */
export function OrderItemRows({ order, items, flagFor, canVoid, onVoid }: OrderItemRowsProps) {
  const isEditable = order.status === 'open'
  return (
    <ul className="m-0 flex list-none flex-col gap-3 p-0">
      {items.map((item) =>
        isEditable && !isVoided(item) ? (
          <EditableItem key={item.id} orderId={order.id} item={item} flag={flagFor(order.id, item.id)} />
        ) : (
          <OrderItemLine
            key={item.id}
            item={item}
            showPrice
            flag={flagFor(order.id, item.id)}
            action={
              canVoid && !isVoided(item) ? (
                <VoidItemButton
                  item={item}
                  onVoid={() => {
                    onVoid(item)
                  }}
                />
              ) : null
            }
          />
        ),
      )}
    </ul>
  )
}
