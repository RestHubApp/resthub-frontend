import { Suspense, useState } from 'react'

import { PERMISSION } from '@/api/permissions'
import type { OrderItemResponse, OrderResponse } from '@/api/types'
import { lazyNamed } from '@/components/lazyNamed'
import { SectionCard } from '@/components/SectionCard'
import { useCan } from '@/store/session'
import { canVoidItems } from '@/features/orders/kitchenRounds'
import type { FlagFor } from '@/features/orders/noteFlags'
import { RoundGroups } from '@/features/orders/RoundGroups'
import { OrderItemRows } from './OrderItemRows'

// La ventana trae react-hook-form y zod: se baja al abrirla.
const VoidItemDialog = lazyNamed(() => import('./VoidItemDialog'), 'VoidItemDialog')

interface OrderItemsProps {
  readonly order: OrderResponse
  readonly flagFor: FlagFor
  /** Abre la cancelación del pedido (la sugiere anular el último plato). */
  readonly onCancelOrder: () => void
}

/**
 * Los platos del pedido, por ronda. Abierto, cada uno se puede cambiar o
 * quitar; ya en cocina, quien gestiona pedidos puede anular uno con su motivo.
 */
export function OrderItems({ order, flagFor, onCancelOrder }: OrderItemsProps) {
  const isEditable = order.status === 'open'
  const canVoid = useCan(PERMISSION.ordersManage) && canVoidItems(order)
  const [voiding, setVoiding] = useState<OrderItemResponse | null>(null)

  return (
    <SectionCard
      title="Platos"
      description={isEditable ? 'Todavía no está en cocina: puedes cambiar cantidades, notas o quitar platos.' : undefined}
    >
      {order.items.length === 0 ? (
        <p className="m-0 text-muted-foreground">Este pedido no tiene platos.</p>
      ) : (
        <RoundGroups
          order={order}
          renderItems={(items) => (
            <OrderItemRows order={order} items={items} flagFor={flagFor} canVoid={canVoid} onVoid={setVoiding} />
          )}
        />
      )}
      <Suspense fallback={null}>
        {voiding === null ? null : (
          <VoidItemDialog
            order={order}
            item={voiding}
            onClose={() => {
              setVoiding(null)
            }}
            onCancelOrder={onCancelOrder}
          />
        )}
      </Suspense>
    </SectionCard>
  )
}
