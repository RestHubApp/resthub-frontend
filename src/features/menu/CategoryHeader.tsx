import { useState } from 'react'

import type { MenuSection } from '@/api/types'
import { FormDialog } from '@/components/FormDialog'
import { Icon } from '@/components/Icon'
import { Button } from '@/components/ui/button'
import { CategoryForm } from './CategoryForm'
import { CategoryTitle } from './CategoryTitle'
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

/** El título de una categoría, su resumen y lo que se hace con ella. */
export function CategoryHeader({
  category,
  headingId,
  isFirst,
  isLast,
  onMove,
  onAddItem,
}: CategoryHeaderProps) {
  const [isEditing, setIsEditing] = useState(false)

  return (
    <div className="flex flex-col gap-3 border-b px-5 pb-4 md:flex-row md:items-start md:justify-between">
      <CategoryTitle category={category} headingId={headingId} />

      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="secondary" className="h-11 px-3" onClick={onAddItem}>
          <Icon name="add" size={16} />
          <span>Agregar plato</span>
        </Button>
        <MoveButtons label={`la categoría ${category.name}`} isFirst={isFirst} isLast={isLast} onMove={onMove} />
        <Button
          type="button"
          variant="outline"
          className="h-11 px-3"
          aria-label={`Editar la categoría ${category.name}`}
          onClick={() => {
            setIsEditing(true)
          }}
        >
          <Icon name="edit" size={16} />
          <span>Editar</span>
        </Button>
        <CategoryStatusButton category={category} />
        {category.items.length === 0 ? <DeleteCategoryButton category={category} /> : null}
      </div>

      <FormDialog open={isEditing} onOpenChange={setIsEditing} title={`Editar ${category.name}`}>
        <CategoryForm
          category={category}
          onDone={() => {
            setIsEditing(false)
          }}
        />
      </FormDialog>
    </div>
  )
}
