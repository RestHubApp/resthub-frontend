import type { OrderResponse } from '@/api/types'
import { AllergyAlert } from '@/features/orders/AllergyAlert'
import { ElapsedTime } from '@/features/orders/ElapsedTime'
import { allergyIn, type FlagFor } from '@/features/orders/noteFlags'
import { OrderItemList } from '@/features/orders/OrderItemList'
import { orderPlace } from '@/features/orders/orderLabels'
import { KitchenReadyButton } from './KitchenReadyButton'

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
export function KitchenCard({ order, now, flagFor }: KitchenCardProps) {
  const hasAllergy = allergyIn(order, flagFor) !== undefined

  return (
    <article
      aria-label={`Pedido ${String(order.number)}`}
      className={`flex flex-col gap-3 rounded-xl bg-card p-4 ${hasAllergy ? 'border-l-4 border-destructive ring-2 ring-destructive/60' : 'ring-1 ring-foreground/10'}`}
    >
      <header className="flex items-start justify-between gap-2">
        <div>
          <p className="m-0 font-heading text-4xl leading-none font-black tabular-nums">#{order.number}</p>
          <p className="m-0 mt-1 text-base font-semibold">{orderPlace(order)}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <ElapsedTime order={order} now={now} />
          {hasAllergy ? <AllergyAlert /> : null}
        </div>
      </header>
      <OrderItemList order={order} flagFor={flagFor} size="large" />
      <KitchenReadyButton order={order} />
    </article>
  )
}
