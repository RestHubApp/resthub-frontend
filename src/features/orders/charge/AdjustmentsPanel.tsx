import { useState } from 'react'

import { applyDiscount } from '../../../api/orders'
import type { OrderResponse } from '../../../api/types'
import Icon from '../../../components/Icon'
import { Button } from '../../../components/ui/button'
import { formatPercent, toCents } from '../../../services/format'
import { useCan } from '../../../store/session'
import { useOrderAction } from '../useOrderAction'
import CourtesyItem from './CourtesyItem'
import DiscountForm from './DiscountForm'

interface AdjustmentsPanelProps {
  readonly order: OrderResponse
}

/**
 * Descuento y cortesías, antes del primer pago.
 *
 * Después de un pago ya no aparecen: cambiar el total dejaría de cuadrar con
 * lo que pagó cada uno. Las cortesías son del encargado.
 */
export default function AdjustmentsPanel({ order }: AdjustmentsPanelProps) {
  const [descontando, setDescontando] = useState(false)
  const invita = useCan('orders.discount_any')
  const quitar = useOrderAction({
    mutationFn: () => applyDiscount(order.id, { percent: '0', reason: '' }),
    success: () => 'Descuento quitado.',
    failure: 'No se pudo quitar el descuento.',
  })
  if (order.payments.length > 0) {
    return null
  }
  const conDescuento = toCents(order.discount_amount) > 0
  const cerrarDescuento = () => {
    setDescontando(false)
  }

  return (
    <section aria-label="Descuentos y cortesías" className="flex flex-col gap-2">
      {descontando ? (
        <DiscountForm order={order} onDone={cerrarDescuento} />
      ) : (
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setDescontando(true)
            }}
          >
            <Icon name="descuento" size={16} />
            <span>
              {conDescuento ? `Cambiar descuento (${formatPercent(order.discount_percent)})` : 'Aplicar descuento'}
            </span>
          </Button>
          {conDescuento ? (
            <Button
              type="button"
              variant="ghost"
              disabled={quitar.isPending}
              onClick={() => {
                quitar.mutate()
              }}
            >
              Quitar descuento
            </Button>
          ) : null}
        </div>
      )}
      {invita ? (
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
