import type { DishCost, MenuItem } from '@/api/types'
import { StatusBadge } from '@/components/StatusBadge'
import { formatMoney } from '@/services/format'
import { DishMargin } from './DishMargin'

interface MenuItemInfoProps {
  readonly item: MenuItem
  readonly cost: DishCost | undefined
}

/** Lo que se ve de un plato: nombre, precio, marcas de estado, descripción y margen. */
export function MenuItemInfo({ item, cost }: MenuItemInfoProps) {
  const isOutOfStock = item.is_active && !item.is_available

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-1">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <h3 className="m-0 text-base font-semibold text-foreground">{item.name}</h3>
        <span className="font-semibold text-foreground tabular-nums">{formatMoney(item.price)}</span>
        {isOutOfStock ? <StatusBadge label="Agotado hoy" tone="cancelled" /> : null}
        {item.is_active ? null : <StatusBadge label="Fuera de la carta" />}
      </div>
      {item.description === '' ? null : (
        <p className="m-0 line-clamp-2 text-sm text-muted-foreground">{item.description}</p>
      )}
      <DishMargin itemId={item.id} itemName={item.name} cost={cost} />
    </div>
  )
}
