import type { AdjustmentRequest, Ingredient } from '../../api/types'
import type { AdjustmentValues } from './inventorySchema'
import { findInputUnit, parseDecimal, toBaseQuantity } from './units'

type Campos = Pick<AdjustmentValues, 'mode' | 'quantity' | 'quantity_unit' | 'sign'>

/** Cuánto cambia el stock con este ajuste, o `null` si todavía no se puede saber. */
export function adjustmentDelta(values: Campos, ingredient: Ingredient): number | null {
  const base = parseDecimal(values.quantity) * findInputUnit(ingredient.unit, values.quantity_unit).factor
  if (values.quantity.trim() === '' || !Number.isFinite(base)) {
    return null
  }
  if (values.mode === 'count') {
    return base - Number(ingredient.stock)
  }
  return values.sign === 'subtract' ? -base : base
}

/**
 * El cuerpo de `POST /inventory/adjustments`.
 *
 * Con un conteo se manda lo contado y el servidor calcula la diferencia con
 * su propio stock, que puede haber cambiado desde que se abrió la ventana.
 */
export function adjustmentPayload(values: AdjustmentValues, ingredient: Ingredient): AdjustmentRequest {
  const cantidad = toBaseQuantity(values.quantity, findInputUnit(ingredient.unit, values.quantity_unit).factor)
  if (values.mode === 'count') {
    return { ingredient_id: ingredient.id, reason: values.reason, counted_stock: cantidad }
  }
  return {
    ingredient_id: ingredient.id,
    reason: values.reason,
    quantity: values.sign === 'subtract' ? `-${cantidad}` : cantidad,
  }
}
