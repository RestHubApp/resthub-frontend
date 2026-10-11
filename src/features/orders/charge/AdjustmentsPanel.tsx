import { useState } from 'react'

import { applyDiscount } from '@/api/orders'
import { PERMISSION } from '@/api/permissions'
import type { OrderResponse } from '@/api/types'
import { useCan } from '@/store/session'
import { useOrderAction } from '@/features/orders/useOrderAction'
import { CourtesyList } from './CourtesyList'
import { DiscountControls } from './DiscountControls'
import { DiscountForm } from './DiscountForm'

interface AdjustmentsPanelProps {
  readonly order: OrderResponse
}

/**
 * Descuento y cortesías, antes del primer pago.
 *
 * Después de un pago ya no aparecen: cambiar el total dejaría de cuadrar con
 * lo que pagó cada uno. Las cortesías son del encargado.
 */
export function AdjustmentsPanel({ order }: AdjustmentsPanelProps) {
  const [isDiscounting, setIsDiscounting] = useState(false)
  const isInviting = useCan(PERMISSION.ordersDiscountAny)
  const remove = useOrderAction({
    mutationFn: () => applyDiscount(order.id, { percent: '0', reason: '' }),
    success: () => 'Descuento quitado.',
    failure: 'No se pudo quitar el descuento.',
  })
  if (order.payments.length > 0) {
    return null
  }
  const closeDiscount = () => {
    setIsDiscounting(false)
  }
  const startDiscount = () => {
    setIsDiscounting(true)
  }
  const removeDiscount = () => {
    remove.mutate()
  }

  return (
    <section aria-label="Descuentos y cortesías" className="flex flex-col gap-2">
      {isDiscounting ? (
        <DiscountForm order={order} onDone={closeDiscount} />
      ) : (
        <DiscountControls
          order={order}
          isRemoving={remove.isPending}
          onStart={startDiscount}
          onRemove={removeDiscount}
        />
      )}
      {isInviting ? <CourtesyList order={order} /> : null}
    </section>
  )
}
