import type { Ingredient } from '@/api/types'
import { ActionsMenu, type ActionsMenuItem } from '@/components/ActionsMenu'
import { Icon } from '@/components/Icon'
import * as icons from '@/components/icons'
import { Button } from '@/components/ui/button'
import type { StockAction } from './StockActionDialog'

interface IngredientRowActionsProps {
  readonly ingredient: Ingredient
  readonly onAction: (action: StockAction) => void
}

/**
 * Compra a la vista, que es lo más frecuente; merma, ajuste y edición tras
 * «⋯». El nombre accesible agrega el insumo: en la tabla hay treinta botones
 * «Compra» y el lector tiene que distinguirlos.
 */
export function IngredientRowActions({ ingredient, onAction }: IngredientRowActionsProps) {
  const item = (kind: 'waste' | 'adjustment' | 'edit', label: string, icon: ActionsMenuItem['icon']): ActionsMenuItem => ({
    label,
    ...(icon === undefined ? {} : { icon }),
    onSelect: () => {
      onAction({ kind, ingredient })
    },
  })

  return (
    <div className="flex items-center gap-1.5">
      <Button
        type="button"
        size="sm"
        variant="secondary"
        aria-label={`Compra de ${ingredient.name}`}
        onClick={() => {
          onAction({ kind: 'purchase', ingredient })
        }}
      >
        <Icon glyph={icons.purchase} size={16} />
        <span>Compra</span>
      </Button>
      <ActionsMenu
        label={`Más acciones de ${ingredient.name}`}
        items={[item('waste', 'Merma', icons.waste), item('adjustment', 'Ajuste', icons.count), item('edit', 'Editar', icons.edit)]}
      />
    </div>
  )
}
