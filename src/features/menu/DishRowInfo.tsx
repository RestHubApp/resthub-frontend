import type { MenuItem } from '@/api/types'
import { StatusBadge } from '@/components/StatusBadge'
import { formatMoney } from '@/services/format'

interface DishRowInfoProps {
  readonly item: MenuItem
}

/** Lo que dice una fila de la carta: el nombre, el precio y si el plato está agotado o fuera de la carta. */
export function DishRowInfo({ item }: DishRowInfoProps) {
  const isOutOfStock = item.is_active && !item.is_available

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
      <h3 className="m-0 text-base leading-snug font-semibold break-words text-foreground">{item.name}</h3>
      <p className="m-0 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
        <span className="font-semibold text-foreground tabular-nums">{formatMoney(item.price)}</span>
        {isOutOfStock ? <StatusBadge label="Agotado hoy" tone="cancelled" /> : null}
        {item.is_active ? null : <StatusBadge label="Fuera de la carta" />}
      </p>
    </div>
  )
}
