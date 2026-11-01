import { Icon } from '@/components/Icon'
import * as icons from '@/components/icons'
import { Button } from '@/components/ui/button'

interface NewIngredientButtonProps {
  readonly onClick: () => void
}

/** La acción de la cabecera del inventario: dar de alta un insumo. */
export function NewIngredientButton({ onClick }: NewIngredientButtonProps) {
  return (
    <Button type="button" onClick={onClick}>
      <Icon glyph={icons.add} size={16} />
      <span>Nuevo insumo</span>
    </Button>
  )
}
