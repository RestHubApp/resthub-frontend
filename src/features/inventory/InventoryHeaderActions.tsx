import { Icon } from '@/components/Icon'
import * as icons from '@/components/icons'
import { Button } from '@/components/ui/button'
import { NewIngredientButton } from './NewIngredientButton'

interface InventoryHeaderActionsProps {
  readonly onRules: () => void
  readonly onNewIngredient: () => void
}

/** Los botones de la cabecera del inventario: las reglas de stock y el alta de un insumo. */
export function InventoryHeaderActions({ onRules, onNewIngredient }: InventoryHeaderActionsProps) {
  return (
    <>
      <Button type="button" variant="outline" onClick={onRules}>
        <Icon glyph={icons.settings} size={16} />
        <span>Reglas de stock</span>
      </Button>
      <NewIngredientButton onClick={onNewIngredient} />
    </>
  )
}
