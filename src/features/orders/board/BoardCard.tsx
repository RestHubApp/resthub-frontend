import { Link } from 'react-router'

import type { OrderResponse } from '../../../api/types'
import { formatMoney, minutesSince } from '../format'
import OrderItemLine from '../OrderItemLine'
import { orderPlace } from '../orderLabels'
import BoardCardActions from './BoardCardActions'
import ElapsedTime from './ElapsedTime'

interface BoardCardProps {
  readonly order: OrderResponse
  readonly now: number
  readonly onCharge: (order: OrderResponse) => void
  readonly onCancel: (order: OrderResponse) => void
}

/**
 * Un pedido en el tablero.
 *
 * El numero manda, porque es lo que se grita en la cocina. Las notas de cada
 * plato van resaltadas. Un pedido que acaba de llegar lleva "Nuevo" durante
 * su primer minuto, para que se note que aparecio sin que nadie recargue.
 */
export default function BoardCard({ order, now, onCharge, onCancel }: BoardCardProps) {
  const tituloId = `pedido-${String(order.id)}`
  const nuevo = minutesSince(order.created_at, now) < 1

  return (
    <article
      aria-labelledby={tituloId}
      className="flex flex-col gap-3 rounded-xl bg-card p-3.5 shadow-xs ring-1 ring-foreground/10"
    >
      <header className="flex items-start justify-between gap-2">
        <h3 id={tituloId} className="m-0 font-heading text-2xl leading-none font-black tabular-nums">
          <Link to={`/pedidos/${String(order.id)}`} className="rounded outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50">
            <span className="sr-only">Pedido </span>#{order.number}
          </Link>
        </h3>
        <div className="flex flex-wrap justify-end gap-1">
          {nuevo ? (
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
      <ul className="m-0 flex list-none flex-col gap-1.5 border-t px-0 pt-3 pb-0 text-sm">
        {order.items.map((item) => (
          <OrderItemLine key={item.id} item={item} />
        ))}
      </ul>
      {order.notes === '' ? null : (
        <p className="m-0 rounded-md bg-muted px-2 py-1 text-sm">
          <span className="font-semibold">Nota:</span> {order.notes}
        </p>
      )}
      <BoardCardActions order={order} onCharge={onCharge} onCancel={onCancel} />
    </article>
  )
}
