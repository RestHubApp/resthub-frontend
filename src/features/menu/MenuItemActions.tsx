import { useState } from 'react'

import { updateMenuItem } from '@/api/menu'
import type { MenuItem, MenuSection } from '@/api/types'
import { ActionsMenu, type ActionsMenuItem } from '@/components/ActionsMenu'
import { Icon } from '@/components/Icon'
import { Button } from '@/components/ui/button'
import { AvailabilityToggle } from './AvailabilityToggle'
import { withItem } from './menuCache'
import type { Direction } from './menuOrder'
import { type MenuItemDialog, MenuItemDialogs } from './MenuItemDialogs'
import { useMenuAction } from './useMenuAction'

interface MenuItemActionsProps {
  readonly item: MenuItem
  readonly categories: readonly MenuSection[]
  readonly isFirst: boolean
  readonly isLast: boolean
  readonly onMove: (direction: Direction) => void
}

interface MenuEntriesOptions {
  readonly item: MenuItem
  readonly isFirst: boolean
  readonly isLast: boolean
  readonly isPending: boolean
  readonly onMove: (direction: Direction) => void
  readonly onDialog: (dialog: MenuItemDialog) => void
  readonly activate: () => void
}

/** Subir, bajar y sacar el plato de la carta (o devolverlo). */
function menuEntries({ item, isFirst, isLast, isPending, onMove, onDialog, activate }: MenuEntriesOptions): ActionsMenuItem[] {
  return [
    { label: 'Subir', icon: 'up', isDisabled: isFirst, onSelect: () => { onMove('up') } },
    { label: 'Bajar', icon: 'down', isDisabled: isLast, onSelect: () => { onMove('down') } },
    item.is_active
      ? { label: 'Desactivar', icon: 'turnOn', isDestructive: true, onSelect: () => { onDialog('deactivate') } }
      : { label: 'Activar', icon: 'turnOn', isDisabled: isPending, onSelect: activate },
  ]
}

/**
 * Lo que se hace con un plato: «Disponible hoy» y «Editar» a la vista, que es
 * lo que se toca a diario; subir, bajar y sacar de la carta tras «⋯».
 *
 * Sacar un plato de la carta no es «agotado hoy»: desaparece de la carta del
 * mesero hasta que alguien lo active. Por eso desactivar se confirma.
 */
export function MenuItemActions({ item, categories, isFirst, isLast, onMove }: MenuItemActionsProps) {
  const [dialog, setDialog] = useState<MenuItemDialog>(null)
  const status = useMenuAction({
    send: () => updateMenuItem(item.id, { is_active: !item.is_active }),
    updateCache: withItem,
    failure: `No se pudo actualizar ${item.name}.`,
  })
  const items = menuEntries({ item, isFirst, isLast, isPending: status.isPending, onMove, onDialog: setDialog, activate: () => { status.mutate() } })

  return (
    <div className="flex flex-wrap items-center gap-2">
      {item.is_active ? <AvailabilityToggle item={item} /> : null}
      <Button
        type="button"
        variant="outline"
        className="px-3"
        aria-label={`Editar ${item.name}`}
        onClick={() => {
          setDialog('edit')
        }}
      >
        <Icon name="edit" size={16} />
        <span>Editar</span>
      </Button>
      <ActionsMenu label={`Más acciones de ${item.name}`} items={items} />
      <MenuItemDialogs
        item={item}
        categories={categories}
        dialog={dialog}
        onDialog={setDialog}
        onDeactivate={() => {
          status.mutate()
        }}
      />
    </div>
  )
}
