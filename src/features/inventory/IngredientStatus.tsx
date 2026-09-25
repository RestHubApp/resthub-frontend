import type { Ingredient } from '../../api/types'
import StatusBadge from '../../components/StatusBadge'

interface IngredientStatusProps {
  readonly ingredient: Ingredient
}

/**
 * Cómo está el stock de un insumo, escrito: el color acompaña.
 *
 * Negativo es más grave que bajo mínimo: se vendió algo que el sistema dice
 * que no había, así que falta registrar una compra o contar de nuevo.
 */
export default function IngredientStatus({ ingredient }: IngredientStatusProps) {
  if (!ingredient.is_active) {
    return <StatusBadge label="Inactivo" />
  }
  if (ingredient.is_negative) {
    return <StatusBadge label="Negativo" tone="cancelled" />
  }
  if (ingredient.is_low) {
    return <StatusBadge label="Bajo mínimo" tone="pending" />
  }
  return <StatusBadge label="Suficiente" tone="completed" />
}
