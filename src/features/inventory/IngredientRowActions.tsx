import type { Ingredient } from '@/api/types'
import { Icon } from '@/components/Icon'
import type { IconName } from '@/components/icons'
import { Button } from '@/components/ui/button'
import type { StockAction } from './StockActionDialog'

interface IngredientRowActionsProps {
  readonly ingredient: Ingredient
  readonly onAction: (action: StockAction) => void
}

type Kind = Exclude<StockAction['kind'], 'create'>

const ACTIONS: readonly { readonly kind: Kind; readonly label: string; readonly icon: IconName }[] = [
  { kind: 'purchase', label: 'Compra', icon: 'purchase' },
  { kind: 'waste', label: 'Merma', icon: 'waste' },
  { kind: 'adjustment', label: 'Ajuste', icon: 'count' },
  { kind: 'edit', label: 'Editar', icon: 'edit' },
]

// El nombre accesible empieza con el texto visible y agrega el insumo: en la
// tabla hay treinta botones "Compra" y el lector tiene que distinguirlos.
const NAMES: Record<Kind, string> = {
  purchase: 'Compra de',
  waste: 'Merma de',
  adjustment: 'Ajuste de',
  edit: 'Editar',
}

/** Compra, merma, ajuste y edición de un insumo, desde su fila. */
export function IngredientRowActions({ ingredient, onAction }: IngredientRowActionsProps) {
  return (
    <div className="flex gap-1.5">
      {ACTIONS.map((action) => (
        <Button
          key={action.kind}
          type="button"
          variant={action.kind === 'purchase' ? 'secondary' : 'outline'}
          className="h-11 px-2.5"
          aria-label={`${NAMES[action.kind]} ${ingredient.name}`}
          onClick={() => {
            onAction({ kind: action.kind, ingredient })
          }}
        >
          <Icon name={action.icon} size={16} />
          <span>{action.label}</span>
        </Button>
      ))}
    </div>
  )
}
