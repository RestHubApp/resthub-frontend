import { advanceOrder } from '../../../api/orders'
import type { OrderResponse } from '../../../api/types'
import Icon from '../../../components/Icon'
import { Button } from '../../../components/ui/button'
import { useCan } from '../../../store/session'
import AllergyAlert from '../AllergyAlert'
import ElapsedTime from '../board/ElapsedTime'
import ItemNote from '../ItemNote'
import { allergyIn, type FlagFor } from '../noteFlags'
import OrderItemLine from '../OrderItemLine'
import { orderPlace } from '../orderLabels'
import { stepDoneMessage } from '../nextStep'
import { useOrderAction } from '../useOrderAction'

interface KitchenCardProps {
  readonly order: OrderResponse
  readonly now: number
  readonly flagFor: FlagFor
}

/**
 * Un pedido en la pantalla de cocina: número, platos, notas y el tiempo que lleva.
 *
 * Sin precios ni cobro: en la cocina solo importa qué preparar y para quién.
 * Marcar listo lo hace quien tiene `orders.manage`; el resto solo mira.
 */
export default function KitchenCard({ order, now, flagFor }: KitchenCardProps) {
  const puedeMarcar = useCan('orders.manage') && order.status === 'in_kitchen'
  const listo = useOrderAction({
    mutationFn: () => advanceOrder(order.id, 'ready'),
    success: stepDoneMessage,
    failure: 'No se pudo marcar como listo.',
  })
  const alergia = allergyIn(order, flagFor) !== undefined

  return (
    <article
      aria-label={`Pedido ${String(order.number)}`}
      className={`flex flex-col gap-3 rounded-xl bg-card p-4 shadow-xs ${alergia ? 'border-l-4 border-destructive ring-2 ring-destructive/60' : 'ring-1 ring-foreground/10'}`}
    >
      <header className="flex items-start justify-between gap-2">
        <div>
          <p className="m-0 font-heading text-4xl leading-none font-black tabular-nums">#{order.number}</p>
          <p className="m-0 mt-1 text-base font-semibold">{orderPlace(order)}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <ElapsedTime order={order} now={now} />
          {alergia ? <AllergyAlert /> : null}
        </div>
      </header>
      <ul className="m-0 flex list-none flex-col gap-2 border-t px-0 pt-3 pb-0 text-base">
        {order.items.map((item) => (
          <OrderItemLine key={item.id} item={item} flag={flagFor(order.id, item.id)} />
        ))}
      </ul>
      <ItemNote note={order.notes} flag={flagFor(order.id, null)} label="Nota del pedido" />
      {puedeMarcar ? (
        <Button type="button" size="lg" className="h-12 text-base" disabled={listo.isPending} onClick={() => {
          listo.mutate()
        }}>
          <Icon name="listo" size={18} />
          <span>{listo.isPending ? 'Guardando…' : 'Listo'}</span>
        </Button>
      ) : null}
    </article>
  )
}
