import type { OrderResponse } from '@/api/types'
import { EmptyState } from '@/components/EmptyState'
import { SectionCard } from '@/components/SectionCard'
import type { FlagFor } from '@/features/orders/noteFlags'
import { KitchenCard } from './KitchenCard'

interface KitchenSectionProps {
  readonly title: string
  readonly orders: readonly OrderResponse[]
  /** Lo que dice la sección cuando no hay pedidos (solo una vez cargada la lista). */
  readonly emptyTitle: string
  readonly isLoaded: boolean
  readonly now: number
  readonly flagFor: FlagFor
  readonly isCollapsible?: boolean
  /** Sin pedidos, la sección no ocupa lugar en el celular. */
  readonly isHiddenWhenEmptyOnPhone?: boolean
}

/** Una sección de la pantalla de cocina: sus tarjetas de pedido o el aviso de que no hay ninguno. */
export function KitchenSection({
  title,
  orders,
  emptyTitle,
  isLoaded,
  now,
  flagFor,
  isCollapsible = false,
  isHiddenWhenEmptyOnPhone = false,
}: KitchenSectionProps) {
  const isEmpty = orders.length === 0
  return (
    <div className={isHiddenWhenEmptyOnPhone && isEmpty ? 'hidden sm:block' : undefined}>
      <SectionCard title={`${title} (${String(orders.length)})`} collapsible={isCollapsible}>
        {isLoaded && isEmpty ? <EmptyState title={emptyTitle} /> : null}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {orders.map((order) => (
            <KitchenCard key={order.id} order={order} now={now} flagFor={flagFor} />
          ))}
        </div>
      </SectionCard>
    </div>
  )
}
