import { Link } from 'react-router'

import type { OrderResponse } from '@/api/types'
import { AllergyAlert } from '@/features/orders/AllergyAlert'
import { allergyIn, type FlagFor } from '@/features/orders/noteFlags'
import { OrderItemList } from '@/features/orders/OrderItemList'
import { orderPlace } from '@/features/orders/orderLabels'
import { BoardCardActions } from './BoardCardActions'
import { ElapsedTime } from '@/features/orders/ElapsedTime'
import { formatMoney, minutesSince } from '@/services/format'
import { paths } from '@/services/paths'

interface BoardCardProps {
  readonly order: OrderResponse
  readonly now: number
  readonly flagFor: FlagFor
  readonly onCharge: (order: OrderResponse) => void
  readonly onCancel: (order: OrderResponse) => void
}

/**
 * Un pedido en el tablero.
 *
 * El numero manda, porque es lo que se grita en la cocina. Las notas de cada
 * plato van resaltadas, y un pedido con alergia en alguna nota lleva borde
 * rojo y "Con alergia" escrito en el encabezado. Un pedido que acaba de llegar lleva "Nuevo" durante
 * su primer minuto, para que se note que aparecio sin que nadie recargue.
 */
export function BoardCard({ order, now, flagFor, onCharge, onCancel }: BoardCardProps) {
  const titleId = `pedido-${String(order.id)}`
  const isFresh = minutesSince(order.created_at, now) < 1
  const hasAllergy = allergyIn(order, flagFor) !== undefined

  return (
    <article
      aria-labelledby={titleId}
      className={`flex flex-col gap-3 rounded-xl bg-card p-3.5 ${hasAllergy ? 'border-l-4 border-destructive ring-2 ring-destructive/60' : 'ring-1 ring-foreground/10'}`}
    >
      <header className="flex items-start justify-between gap-2">
        <h3 id={titleId} className="m-0 font-heading text-2xl leading-none font-black tabular-nums">
          <Link to={paths.orders.detail(order.id)} className="rounded outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50">
            <span className="sr-only">Pedido </span>#{order.number}
          </Link>
        </h3>
        <div className="flex flex-wrap justify-end gap-1">
          {hasAllergy ? <AllergyAlert /> : null}
          {isFresh ? (
            <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground">Nuevo</span>
          ) : null}
          <ElapsedTime order={order} now={now} />
        </div>
      </header>
      <div className="flex flex-col">
        <p className="m-0 font-semibold">{orderPlace(order)}</p>
        <p className="m-0 text-sm text-muted-foreground">
          {order.waiter_name} · {formatMoney(order.total)}
        </p>
      </div>
      <OrderItemList order={order} flagFor={flagFor} size="compact" />
      <BoardCardActions order={order} onCharge={onCharge} onCancel={onCancel} />
    </article>
  )
}
