import type { DishCost, MenuItem } from '@/api/types'
import { Icon } from '@/components/Icon'
import { Button } from '@/components/ui/button'
import { DishMargin } from './DishMargin'
import { DishPhotoField } from './DishPhotoField'
import { DishOrderButtons } from './DishOrderButtons'
import type { Direction } from './menuOrder'

interface DishSheetBodyProps {
  readonly item: MenuItem
  readonly cost: DishCost | undefined
  readonly isFirst: boolean
  readonly isLast: boolean
  readonly isPending: boolean
  readonly onMove: (direction: Direction) => void
  readonly onEdit: () => void
  readonly onDeactivate: () => void
  readonly onActivate: () => void
}

/** La ficha de un plato: descripción, foto, costo y margen con el camino a la receta, y lo que se hace con él. */
export function DishSheetBody({ item, cost, isFirst, isLast, isPending, onMove, onEdit, onDeactivate, onActivate }: DishSheetBodyProps) {
  return (
    <>
      <p className="m-0 text-sm text-foreground">
        {item.description === '' ? <span className="text-muted-foreground">Sin descripción.</span> : item.description}
      </p>
      <DishPhotoField item={item} />
      <DishMargin itemId={item.id} itemName={item.name} cost={cost} />
      <div className="flex flex-col gap-2 border-t pt-4">
        <Button type="button" onClick={onEdit}>
          <Icon name="edit" size={16} />
          <span>Editar plato</span>
        </Button>
        <DishOrderButtons isFirst={isFirst} isLast={isLast} onMove={onMove} />
        {item.is_active ? (
          <Button type="button" variant="ghost" className="text-destructive hover:text-destructive" onClick={onDeactivate}>
            <Icon name="turnOn" size={16} />
            <span>Desactivar</span>
          </Button>
        ) : (
          <Button type="button" variant="secondary" disabled={isPending} onClick={onActivate}>
            <Icon name="turnOn" size={16} />
            <span>Activar</span>
          </Button>
        )}
      </div>
    </>
  )
}
