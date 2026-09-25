import { Link } from 'react-router'

import type { OrderResponse } from '../../../api/types'
import AllergyAlert from '../AllergyAlert'
import ItemNote from '../ItemNote'
import { allergyIn, type FlagFor } from '../noteFlags'
import OrderItemLine from '../OrderItemLine'
import { orderPlace } from '../orderLabels'
import BoardCardActions from './BoardCardActions'
import ElapsedTime from './ElapsedTime'
import { formatMoney, minutesSince } from '../../../services/format'

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
export default function BoardCard({ order, now, flagFor, onCharge, onCancel }: BoardCardProps) {
  const tituloId = `pedido-${String(order.id)}`
  const nuevo = minutesSince(order.created_at, now) < 1
  const alergia = allergyIn(order, flagFor) !== undefined

  return (
    <article
      aria-labelledby={tituloId}
      className={`flex flex-col gap-3 rounded-xl bg-card p-3.5 shadow-xs ${alergia ? 'border-l-4 border-destructive ring-2 ring-destructive/60' : 'ring-1 ring-foreground/10'}`}
    >
      <header className="flex items-start justify-between gap-2">
        <h3 id={tituloId} className="m-0 font-heading text-2xl leading-none font-black tabular-nums">
          <Link to={`/pedidos/${String(order.id)}`} className="rounded outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50">
            <span className="sr-only">Pedido </span>#{order.number}
          </Link>
        </h3>
        <div className="flex flex-wrap justify-end gap-1">
          {alergia ? <AllergyAlert /> : null}
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
          <OrderItemLine key={item.id} item={item} flag={flagFor(order.id, item.id)} />
        ))}
      </ul>
      <ItemNote note={order.notes} flag={flagFor(order.id, null)} label="Nota del pedido" />
      <BoardCardActions order={order} onCharge={onCharge} onCancel={onCancel} />
    </article>
  )
}
