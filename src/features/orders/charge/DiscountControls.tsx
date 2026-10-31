import type { OrderResponse } from '@/api/types'
import { Icon } from '@/components/Icon'
import * as icons from '@/components/icons'
import { Button } from '@/components/ui/button'
import { formatPercent, toCents } from '@/services/format'

interface DiscountControlsProps {
  readonly order: OrderResponse
  readonly isRemoving: boolean
  readonly onStart: () => void
  readonly onRemove: () => void
}

/** Los botones para aplicar, cambiar o quitar el descuento del pedido. */
export function DiscountControls({ order, isRemoving, onStart, onRemove }: DiscountControlsProps) {
  const hasDiscount = toCents(order.discount_amount) > 0

  return (
    <div className="flex flex-wrap gap-2">
      <Button type="button" variant="outline" onClick={onStart}>
        <Icon glyph={icons.discount} size={16} />
        <span>
          {hasDiscount ? `Cambiar descuento (${formatPercent(order.discount_percent)})` : 'Aplicar descuento'}
        </span>
      </Button>
      {hasDiscount ? (
        <Button type="button" variant="ghost" disabled={isRemoving} onClick={onRemove}>
          Quitar descuento
        </Button>
      ) : null}
    </div>
  )
}
