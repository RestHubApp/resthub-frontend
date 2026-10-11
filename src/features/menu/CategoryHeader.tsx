import { useState } from 'react'

import type { MenuSection } from '@/api/types'
import { FormDialog } from '@/components/FormDialog'
import { Icon } from '@/components/Icon'
import { StatusBadge } from '@/components/StatusBadge'
import { Button } from '@/components/ui/button'
import { CategoryForm } from './CategoryForm'
import { CategoryStatusButton } from './CategoryStatusButton'
import { DeleteCategoryButton } from './DeleteCategoryButton'
import type { Direction } from './menuOrder'
import { MoveButtons } from './MoveButtons'

interface CategoryHeaderProps {
  readonly category: MenuSection
  readonly headingId: string
  readonly isFirst: boolean
  readonly isLast: boolean
  readonly onMove: (direction: Direction) => void
  readonly onAddItem: () => void
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

/** El título de una categoría, su resumen y lo que se hace con ella. */
export function CategoryHeader({
  category,
  headingId,
  isFirst,
  isLast,
  onMove,
  onAddItem,
}: CategoryHeaderProps) {
  const [editing, setEditing] = useState(false)

  return (
    <div className="flex flex-col gap-3 border-b px-5 pb-4 md:flex-row md:items-start md:justify-between">
      <div className="flex min-w-0 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <h2 id={headingId} className="m-0 font-heading text-lg leading-snug font-semibold">
            {category.name}
          </h2>
          {category.is_active ? null : <StatusBadge label="Inactiva" />}
        </div>
        <p className="m-0 text-sm text-muted-foreground">{summary(category)}</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="secondary" className="h-11 px-3" onClick={onAddItem}>
          <Icon name="agregar" size={16} />
          <span>Agregar plato</span>
        </Button>
        <MoveButtons label={`la categoría ${category.name}`} isFirst={isFirst} isLast={isLast} onMove={onMove} />
        <Button
          type="button"
          variant="outline"
          className="h-11 px-3"
          aria-label={`Editar la categoría ${category.name}`}
          onClick={() => {
            setEditing(true)
          }}
        >
          <Icon name="editar" size={16} />
          <span>Editar</span>
        </Button>
        <CategoryStatusButton category={category} />
        {category.items.length === 0 ? <DeleteCategoryButton category={category} /> : null}
      </div>

      <FormDialog open={editing} onOpenChange={setEditing} title={`Editar ${category.name}`}>
        <CategoryForm
          category={category}
          onDone={() => {
            setEditing(false)
          }}
        />
      </FormDialog>
    </div>
  )
}
