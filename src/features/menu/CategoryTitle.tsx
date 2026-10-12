import type { MenuSection } from '@/api/types'
import { StatusBadge } from '@/components/StatusBadge'

interface CategoryTitleProps {
  readonly category: MenuSection
  readonly headingId: string
}

function count(quantity: number, singular: string, plural: string): string {
  return `${String(quantity)} ${quantity === 1 ? singular : plural}`
}

function summary(category: MenuSection): string {
  const active = category.items.filter((dish) => dish.is_active)
  const outOfStock = active.filter((dish) => !dish.is_available).length
  const dishes = count(active.length, 'plato en carta', 'platos en carta')
  if (outOfStock === 0) {
    return dishes
  }
  return `${dishes}, ${count(outOfStock, 'agotado', 'agotados')} hoy`
}

/** El nombre de una categoría, su marca de inactiva y el resumen de sus platos. */
export function CategoryTitle({ category, headingId }: CategoryTitleProps) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <div className="flex flex-wrap items-center gap-2">
        <h2 id={headingId} className="m-0 font-heading text-lg leading-snug font-semibold">
          {category.name}
        </h2>
        {category.is_active ? null : <StatusBadge label="Inactiva" />}
      </div>
      <p className="m-0 text-sm text-muted-foreground">{summary(category)}</p>
    </div>
  )
}
