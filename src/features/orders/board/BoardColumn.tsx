import type { OrderResponse } from '../../../api/types'
import type { FlagFor } from '../noteFlags'
import BoardCard from './BoardCard'

interface BoardColumnProps {
  readonly title: string
  readonly orders: readonly OrderResponse[]
  readonly now: number
  readonly flagFor: FlagFor
  readonly onCharge: (order: OrderResponse) => void
  readonly onCancel: (order: OrderResponse) => void
}

/** Una columna del tablero: un estado y sus pedidos, del mas antiguo al mas nuevo. */
export default function BoardColumn({ title, orders, now, flagFor, onCharge, onCancel }: BoardColumnProps) {
  return (
    <section aria-label={`${title}: ${String(orders.length)}`} className="flex min-w-0 flex-col gap-3 rounded-2xl bg-muted/60 p-3">
      <h2 className="m-0 flex items-center justify-between px-1 text-base font-semibold">
        <span>{title}</span>
        <span className="rounded-full bg-card px-2.5 py-0.5 text-sm tabular-nums ring-1 ring-foreground/10">{orders.length}</span>
      </h2>
      {orders.length === 0 ? (
        <p className="m-0 px-1 py-4 text-center text-sm text-muted-foreground">Sin pedidos</p>
      ) : (
        <ul className="m-0 flex list-none flex-col gap-3 p-0">
          {orders.map((order) => (
            <li key={order.id}>
              <BoardCard order={order} now={now} flagFor={flagFor} onCharge={onCharge} onCancel={onCancel} />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
