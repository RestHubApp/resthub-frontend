import { useState } from 'react'

import { deleteCategory, updateCategory } from '@/api/menu'
import type { MenuSection } from '@/api/types'
import { ActionsMenu, type ActionsMenuItem } from '@/components/ActionsMenu'
import { Icon } from '@/components/Icon'
import * as icons from '@/components/icons'
import { Button } from '@/components/ui/button'
import { type CategoryDialog, CategoryDialogs } from './CategoryDialogs'
import { withCategory, withoutCategory } from './menuCache'
import type { Direction } from './menuOrder'
import { useMenuAction } from './useMenuAction'

interface CategoryActionsProps {
  readonly category: MenuSection
  readonly isFirst: boolean
  readonly isLast: boolean
  readonly onMove: (direction: Direction) => void
  readonly onAddItem: () => void
}

interface MenuEntriesOptions {
  readonly category: MenuSection
  readonly isFirst: boolean
  readonly isLast: boolean
  readonly isPending: boolean
  readonly onMove: (direction: Direction) => void
  readonly onDialog: (dialog: CategoryDialog) => void
  readonly activate: () => void
}

/** Subir, bajar, desactivar (o activar) y, si está vacía, eliminar. */
function menuEntries({ category, isFirst, isLast, isPending, onMove, onDialog, activate }: MenuEntriesOptions): ActionsMenuItem[] {
  const entries: ActionsMenuItem[] = [
    { label: 'Subir', icon: icons.up, isDisabled: isFirst, onSelect: () => { onMove('up') } },
    { label: 'Bajar', icon: icons.down, isDisabled: isLast, onSelect: () => { onMove('down') } },
    category.is_active
      ? { label: 'Desactivar', icon: icons.turnOn, onSelect: () => { onDialog('deactivate') } }
      : { label: 'Activar', icon: icons.turnOn, isDisabled: isPending, onSelect: activate },
  ]
  if (category.items.length === 0) {
    entries.push({ label: 'Eliminar', icon: icons.delete, isDestructive: true, onSelect: () => { onDialog('delete') } })
  }
  return entries
}

/** Activar o desactivar la categoría y eliminarla. */
function useCategoryMutations(category: MenuSection) {
  const status = useMenuAction({
    send: () => updateCategory(category.id, { is_active: !category.is_active }),
    updateCache: withCategory,
    failure: `No se pudo actualizar la categoría ${category.name}.`,
  })
  const remove = useMenuAction({
    send: () => deleteCategory(category.id),
    updateCache: (menu) => withoutCategory(menu, category.id),
    failure: `No se pudo eliminar la categoría ${category.name}.`,
    success: `Categoría ${category.name} eliminada.`,
  })
  return { status, remove }
}

/**
 * Lo que se hace con una categoría: «Agregar plato» y «Editar» a la vista;
 * subir, bajar, desactivar y eliminar (solo si está vacía) tras «⋯».
 *
 * Eliminar solo se ofrece sin platos: una categoría con platos se desactiva.
 * Si otra persona le agregó uno mientras tanto, el servidor responde 409 y el
 * aviso lo explica.
 */
export function CategoryActions({ category, isFirst, isLast, onMove, onAddItem }: CategoryActionsProps) {
  const [dialog, setDialog] = useState<CategoryDialog>(null)
  const { status, remove } = useCategoryMutations(category)
  const items = menuEntries({
    category,
    isFirst,
    isLast,
    isPending: status.isPending,
    onMove,
    onDialog: setDialog,
    activate: () => {
      status.mutate()
    },
  })

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button type="button" variant="secondary" className="px-3" onClick={onAddItem}>
        <Icon glyph={icons.add} size={16} />
        <span>Agregar plato</span>
      </Button>
      <Button
        type="button"
        variant="outline"
        className="px-3"
        aria-label={`Editar la categoría ${category.name}`}
        onClick={() => {
          setDialog('edit')
        }}
      >
        <Icon glyph={icons.edit} size={16} />
        <span>Editar</span>
      </Button>
      <ActionsMenu label={`Más acciones de la categoría ${category.name}`} items={items} />
      <CategoryDialogs
        category={category}
        dialog={dialog}
        onDialog={setDialog}
        onDeactivate={() => {
          status.mutate()
        }}
        onDelete={() => {
          remove.mutate()
        }}
      />
    </div>
  )
}
