import type { OrderResponse } from '@/api/types'
import { CourtesyItem } from './CourtesyItem'

interface CourtesyListProps {
  readonly order: OrderResponse
}

/** La lista plegable de platos que el encargado puede invitar. */
export function CourtesyList({ order }: CourtesyListProps) {
  return (
    <details className="rounded-lg ring-1 ring-input">
      <summary className="cursor-pointer px-3 py-2 text-sm font-medium">Invitar un plato (cortesía)</summary>
      <ul className="m-0 flex list-none flex-col gap-1 p-2">
        {order.items.map((item) => (
          <CourtesyItem key={item.id} order={order} item={item} />
        ))}
      </ul>
    </details>
  )
}
