import { Icon } from '@/components/Icon'
import { Button } from '@/components/ui/button'

interface NewIngredientButtonProps {
  readonly onClick: () => void
}

/** La acción de la cabecera del inventario: dar de alta un insumo. */
export function NewIngredientButton({ onClick }: NewIngredientButtonProps) {
  return (
    <Button type="button" size="lg" className="h-11 px-4" onClick={onClick}>
      <Icon name="add" size={16} />
      <span>Nuevo insumo</span>
    </Button>
  )
}
