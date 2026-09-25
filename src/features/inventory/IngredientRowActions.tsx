import type { Ingredient } from '../../api/types'
import Icon from '../../components/Icon'
import type { IconName } from '../../components/icons'
import { Button } from '../../components/ui/button'
import type { StockAction } from './StockActionDialog'

interface IngredientRowActionsProps {
  readonly ingredient: Ingredient
  readonly onAction: (action: StockAction) => void
}

type Kind = Exclude<StockAction['kind'], 'create'>

const ACCIONES: readonly { readonly kind: Kind; readonly label: string; readonly icon: IconName }[] = [
  { kind: 'purchase', label: 'Compra', icon: 'compra' },
  { kind: 'waste', label: 'Merma', icon: 'merma' },
  { kind: 'adjustment', label: 'Ajuste', icon: 'conteo' },
  { kind: 'edit', label: 'Editar', icon: 'editar' },
]

// El nombre accesible empieza con el texto visible y agrega el insumo: en la
// tabla hay treinta botones "Compra" y el lector tiene que distinguirlos.
const NOMBRES: Record<Kind, string> = {
  purchase: 'Compra de',
  waste: 'Merma de',
  adjustment: 'Ajuste de',
  edit: 'Editar',
}

/** Compra, merma, ajuste y edición de un insumo, desde su fila. */
export default function IngredientRowActions({ ingredient, onAction }: IngredientRowActionsProps) {
  return (
    <div className="flex gap-1.5">
      {ACCIONES.map((accion) => (
        <Button
          key={accion.kind}
          type="button"
          variant={accion.kind === 'purchase' ? 'secondary' : 'outline'}
          className="h-11 px-2.5"
          aria-label={`${NOMBRES[accion.kind]} ${ingredient.name}`}
          onClick={() => {
            onAction({ kind: accion.kind, ingredient })
          }}
        >
          <Icon name={accion.icon} size={16} />
          <span>{accion.label}</span>
        </Button>
      ))}
    </div>
  )
}
