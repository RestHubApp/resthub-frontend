import { cn } from 'cn'
import { useState } from 'react'

import type { DishCost, MenuItem, MenuSection } from '../../api/types'
import FormDialog from '../../components/FormDialog'
import Icon from '../../components/Icon'
import StatusBadge from '../../components/StatusBadge'
import { Button } from '../../components/ui/button'
import { formatMoney } from '../../services/money'
import AvailabilityToggle from './AvailabilityToggle'
import DishMargin from './DishMargin'
import type { Direction } from './menuOrder'
import MenuItemForm from './MenuItemForm'
import MenuItemStatusButton from './MenuItemStatusButton'
import MoveButtons from './MoveButtons'

interface MenuItemRowProps {
  readonly item: MenuItem
  readonly cost: DishCost | undefined
  readonly categories: readonly MenuSection[]
  readonly isFirst: boolean
  readonly isLast: boolean
  readonly onMove: (direction: Direction) => void
}

/** Un plato de la carta: lo que se ve de él y lo que se hace con él. */
export default function MenuItemRow({
  item,
  cost,
  categories,
  isFirst,
  isLast,
  onMove,
}: MenuItemRowProps) {
  const [editando, setEditando] = useState(false)
  const agotado = item.is_active && !item.is_available

  return (
    <li
      className={cn(
        'flex flex-col gap-3 px-5 py-4 lg:flex-row lg:items-center lg:gap-6',
        !item.is_active && 'bg-muted/60',
      )}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <h3 className="m-0 text-base font-semibold text-foreground">{item.name}</h3>
          <span className="font-semibold text-foreground tabular-nums">{formatMoney(item.price)}</span>
          {agotado ? <StatusBadge label="Agotado hoy" tone="cancelled" /> : null}
          {item.is_active ? null : <StatusBadge label="Fuera de la carta" />}
        </div>
        {item.description === '' ? null : (
          <p className="m-0 line-clamp-2 text-sm text-muted-foreground">{item.description}</p>
        )}
        <DishMargin itemId={item.id} itemName={item.name} cost={cost} />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {item.is_active ? <AvailabilityToggle item={item} /> : null}
        <MoveButtons label={item.name} isFirst={isFirst} isLast={isLast} onMove={onMove} />
        <Button
          type="button"
          variant="outline"
          className="h-11 px-3"
          aria-label={`Editar ${item.name}`}
          onClick={() => {
            setEditando(true)
          }}
        >
          <Icon name="editar" size={16} />
          <span>Editar</span>
        </Button>
        <MenuItemStatusButton item={item} />
      </div>

      <FormDialog open={editando} onOpenChange={setEditando} title={`Editar ${item.name}`} size="lg">
        <MenuItemForm
          item={item}
          categories={categories}
          onDone={() => {
            setEditando(false)
          }}
        />
      </FormDialog>
    </li>
  )
}
