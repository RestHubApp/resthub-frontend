import { useState } from 'react'

import { applyDiscount } from '@/api/orders'
import { PERMISSION } from '@/api/permissions'
import type { OrderResponse } from '@/api/types'
import { Icon } from '@/components/Icon'
import { Button } from '@/components/ui/button'
import { formatPercent, toCents } from '@/services/format'
import { useCan } from '@/store/session'
import { useOrderAction } from '@/features/orders/useOrderAction'
import { CourtesyItem } from './CourtesyItem'
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
  const [discounting, setDiscounting] = useState(false)
  const invites = useCan(PERMISSION.ordersDiscountAny)
  const remove = useOrderAction({
    mutationFn: () => applyDiscount(order.id, { percent: '0', reason: '' }),
    success: () => 'Descuento quitado.',
    failure: 'No se pudo quitar el descuento.',
  })
  if (order.payments.length > 0) {
    return null
  }
  const withDiscount = toCents(order.discount_amount) > 0
  const closeDiscount = () => {
    setDiscounting(false)
  }

  return (
    <section aria-label="Descuentos y cortesías" className="flex flex-col gap-2">
      {discounting ? (
        <DiscountForm order={order} onDone={closeDiscount} />
      ) : (
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setDiscounting(true)
            }}
          >
            <Icon name="descuento" size={16} />
            <span>
              {withDiscount ? `Cambiar descuento (${formatPercent(order.discount_percent)})` : 'Aplicar descuento'}
            </span>
          </Button>
          {withDiscount ? (
            <Button
              type="button"
              variant="ghost"
              disabled={remove.isPending}
              onClick={() => {
                remove.mutate()
              }}
            >
              Quitar descuento
            </Button>
          ) : null}
        </div>
      )}
      {invites ? (
        <details className="rounded-lg ring-1 ring-input">
          <summary className="cursor-pointer px-3 py-2 text-sm font-medium">Invitar un plato (cortesía)</summary>
          <ul className="m-0 flex list-none flex-col gap-1 p-2">
            {order.items.map((item) => (
              <CourtesyItem key={item.id} order={order} item={item} />
            ))}
          </ul>
        </details>
      ) : null}
    </section>
  )
}
