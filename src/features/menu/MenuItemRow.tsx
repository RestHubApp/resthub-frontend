import { cn } from 'cn'
import { useState } from 'react'

import type { DishCost, MenuItem, MenuSection } from '@/api/types'
import { FormDialog } from '@/components/FormDialog'
import { Icon } from '@/components/Icon'
import { Button } from '@/components/ui/button'
import { AvailabilityToggle } from './AvailabilityToggle'
import type { Direction } from './menuOrder'
import { MenuItemForm } from './MenuItemForm'
import { MenuItemInfo } from './MenuItemInfo'
import { MenuItemStatusButton } from './MenuItemStatusButton'
import { MoveButtons } from './MoveButtons'

interface MenuItemRowProps {
  readonly item: MenuItem
  readonly cost: DishCost | undefined
  readonly categories: readonly MenuSection[]
  readonly isFirst: boolean
  readonly isLast: boolean
  readonly onMove: (direction: Direction) => void
}

/** Un plato de la carta: lo que se ve de él y lo que se hace con él. */
export function MenuItemRow({
  item,
  cost,
  categories,
  isFirst,
  isLast,
  onMove,
}: MenuItemRowProps) {
  const [isEditing, setIsEditing] = useState(false)

  return (
    <li
      className={cn(
        'flex flex-col gap-3 px-5 py-4 lg:flex-row lg:items-center lg:gap-6',
        !item.is_active && 'bg-muted/60',
      )}
    >
      <MenuItemInfo item={item} cost={cost} />

      <div className="flex flex-wrap items-center gap-2">
        {item.is_active ? <AvailabilityToggle item={item} /> : null}
        <MoveButtons label={item.name} isFirst={isFirst} isLast={isLast} onMove={onMove} />
        <Button
          type="button"
          variant="outline"
          className="h-11 px-3"
          aria-label={`Editar ${item.name}`}
          onClick={() => {
            setIsEditing(true)
          }}
        >
          <Icon name="edit" size={16} />
          <span>Editar</span>
        </Button>
        <MenuItemStatusButton item={item} />
      </div>

      <FormDialog open={isEditing} onOpenChange={setIsEditing} title={`Editar ${item.name}`} size="lg">
        <MenuItemForm
          item={item}
          categories={categories}
          onDone={() => {
            setIsEditing(false)
          }}
        />
      </FormDialog>
    </li>
  )
}
