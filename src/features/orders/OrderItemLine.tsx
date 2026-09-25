import type { OrderItemResponse } from '../../api/types'
import ItemNote from './ItemNote'
import { formatMoney } from '../../services/format'

interface OrderItemLineProps {
  readonly item: OrderItemResponse
  /** La cocina no necesita precios; el mesero y la caja, si. */
  readonly showPrice?: boolean
}

/** "2 × Lomo saltado", con su nota resaltada debajo. */
export default function OrderItemLine({ item, showPrice = false }: OrderItemLineProps) {
  return (
    <li className="flex flex-col">
      <div className="flex items-baseline gap-2">
        <span className="min-w-7 font-bold tabular-nums">{item.quantity}×</span>
        <span className="min-w-0 flex-1">{item.name}</span>
        {showPrice ? (
          <span className="text-sm tabular-nums text-muted-foreground">{formatMoney(item.subtotal)}</span>
        ) : null}
      </div>
      <div className="pl-9">
        <ItemNote note={item.notes} />
      </div>
    </li>
  )
}
