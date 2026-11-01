import { Icon } from '@/components/Icon'
import * as icons from '@/components/icons'
import { Button } from '@/components/ui/button'

interface MenuHeaderActionsProps {
  /** Hay al menos una categoría: sin ella no se puede crear un plato. */
  readonly canAddItem: boolean
  readonly onNewCategory: () => void
  readonly onNewItem: () => void
}

/** Los botones de la cabecera de la carta: nueva categoría y nuevo plato. */
export function MenuHeaderActions({ canAddItem, onNewCategory, onNewItem }: MenuHeaderActionsProps) {
  return (
    <>
      <Button type="button" variant="outline" onClick={onNewCategory}>
        <Icon glyph={icons.add} size={16} />
        <span>Nueva categoría</span>
      </Button>
      <Button type="button" disabled={!canAddItem} onClick={onNewItem}>
        <Icon glyph={icons.add} size={16} />
        <span>Nuevo plato</span>
      </Button>
    </>
  )
}
