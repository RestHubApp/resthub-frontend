import { cn } from 'cn'

import type { DishCost, MenuItem, MenuSection } from '@/api/types'
import type { Direction } from './menuOrder'
import { MenuItemActions } from './MenuItemActions'
import { MenuItemInfo } from './MenuItemInfo'

interface MenuItemRowProps {
  readonly item: MenuItem
  readonly cost: DishCost | undefined
  readonly categories: readonly MenuSection[]
  readonly isFirst: boolean
  readonly isLast: boolean
  readonly onMove: (direction: Direction) => void
}

/** Un plato de la carta: lo que se ve de él y lo que se hace con él. */
export function MenuItemRow({ item, cost, categories, isFirst, isLast, onMove }: MenuItemRowProps) {
  return (
    <li
      className={cn(
        'flex flex-col gap-3 px-5 py-3 lg:flex-row lg:items-center lg:justify-between lg:gap-6',
        !item.is_active && 'bg-muted/60',
      )}
    >
      <MenuItemInfo item={item} cost={cost} />
      <MenuItemActions item={item} categories={categories} isFirst={isFirst} isLast={isLast} onMove={onMove} />
    </li>
  )
}
