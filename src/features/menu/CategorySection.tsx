import { useId } from 'react'

import type { DishCost, MenuSection } from '@/api/types'
import { Card } from '@/components/ui/card'
import { CategoryHeader } from './CategoryHeader'
import { MenuItemRow } from './MenuItemRow'
import type { Direction } from './menuOrder'

interface CategorySectionProps {
  readonly category: MenuSection
  readonly categories: readonly MenuSection[]
  readonly costs: ReadonlyMap<number, DishCost>
  readonly isFirst: boolean
  readonly isLast: boolean
  readonly onMoveCategory: (direction: Direction) => void
  readonly onMoveItem: (itemId: number, direction: Direction) => void
  readonly onAddItem: () => void
}

/** Una categoría de la carta con sus platos, en el orden en que los ve el mesero. */
export function CategorySection({
  category,
  categories,
  costs,
  isFirst,
  isLast,
  onMoveCategory,
  onMoveItem,
  onAddItem,
}: CategorySectionProps) {
  const headingId = useId()
  const last = category.items.length - 1

  return (
    <section aria-labelledby={headingId}>
      <Card className="gap-0 py-4 shadow-sm">
        <CategoryHeader
          category={category}
          headingId={headingId}
          isFirst={isFirst}
          isLast={isLast}
          onMove={onMoveCategory}
          onAddItem={onAddItem}
        />
        {category.items.length === 0 ? (
          <p className="m-0 px-5 pt-4 text-sm text-muted-foreground">
            Todavía no tiene platos. Agrega uno o, si ya no la usas, elimínala.
          </p>
        ) : (
          <ul className="m-0 list-none divide-y p-0">
            {category.items.map((dish, index) => (
              <MenuItemRow
                key={dish.id}
                item={dish}
                cost={costs.get(dish.id)}
                categories={categories}
                isFirst={index === 0}
                isLast={index === last}
                onMove={(direction) => {
                  onMoveItem(dish.id, direction)
                }}
              />
            ))}
          </ul>
        )}
      </Card>
    </section>
  )
}
