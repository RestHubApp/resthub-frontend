import type { Ingredient } from '../../api/types'
import FormDialog from '../../components/FormDialog'
import AdjustmentForm from './AdjustmentForm'
import IngredientForm from './IngredientForm'
import PurchaseForm from './PurchaseForm'
import WasteForm from './WasteForm'

/** Lo que se hace con un insumo desde cualquier sección del inventario. */
export type StockAction =
  | { readonly kind: 'purchase' | 'waste' | 'adjustment' | 'edit'; readonly ingredient: Ingredient }
  | { readonly kind: 'create' }

interface StockActionDialogProps {
  readonly action: StockAction | null
  readonly onClose: () => void
}

const TITULOS = {
  purchase: 'Registrar compra',
  waste: 'Registrar merma',
  adjustment: 'Ajustar stock',
  edit: 'Editar',
} as const

function titulo(action: StockAction): string {
  return action.kind === 'create' ? 'Nuevo insumo' : `${TITULOS[action.kind]}: ${action.ingredient.name}`
}

function formulario(action: StockAction, onClose: () => void) {
  switch (action.kind) {
    case 'create':
      return <IngredientForm onDone={onClose} />
    case 'edit':
      return <IngredientForm ingredient={action.ingredient} onDone={onClose} />
    case 'purchase':
      return <PurchaseForm ingredient={action.ingredient} onDone={onClose} />
    case 'waste':
      return <WasteForm ingredient={action.ingredient} onDone={onClose} />
    case 'adjustment':
      return <AdjustmentForm ingredient={action.ingredient} onDone={onClose} />
  }
}

/**
 * La ventana de la acción elegida.
 *
 * Una sola para toda la pantalla: la tabla de insumos y las alertas abren la
 * misma compra, y la fila no carga cinco ventanas cerradas.
 */
export default function StockActionDialog({ action, onClose }: StockActionDialogProps) {
  return (
    <FormDialog
      open={action !== null}
      onOpenChange={(abierto) => {
        if (!abierto) {
          onClose()
        }
      }}
      title={action === null ? '' : titulo(action)}
      size="lg"
    >
      {action === null ? null : formulario(action, onClose)}
    </FormDialog>
  )
}
