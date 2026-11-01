import type { PurchaseSuggestion } from '@/api/types'
import { decimalText, hasInvalidLineNumber, isLineCost, isLineQuantity } from './lineNumbers'

/** Una línea de la orden mientras se escribe, con los textos del formulario. */
export interface LineDraft {
  /** Solo para la lista en pantalla: una línea no tiene identidad hasta guardarse. */
  readonly key: string
  readonly ingredientId: string
  readonly quantity: string
  readonly unitCost: string
}

export function emptyLine(): LineDraft {
  return { key: crypto.randomUUID(), ingredientId: '', quantity: '', unitCost: '' }
}

/** Las sugerencias de compra como líneas: cantidad y costo ya calculados. */
export function linesFromSuggestions(suggestions: readonly PurchaseSuggestion[]): LineDraft[] {
  return suggestions.map((suggestion) => ({
    key: crypto.randomUUID(),
    ingredientId: String(suggestion.ingredient_id),
    quantity: suggestion.quantity,
    unitCost: suggestion.unit_cost,
  }))
}


/** Las líneas completas y válidas, o `null` si alguna está a medias. */
export function linesForApi(
  lines: readonly LineDraft[],
): { ingredient_id: number; quantity: string; unit_cost: string }[] | null {
  const complete = lines.filter((line) => line.ingredientId !== '')
  if (complete.length === 0) {
    return null
  }
  const output = []
  for (const line of complete) {
    const quantity = decimalText(line.quantity)
    const cost = decimalText(line.unitCost === '' ? '0' : line.unitCost)
    if (!isLineQuantity(quantity) || !isLineCost(cost) || Number(quantity) <= 0) {
      return null
    }
    output.push({ ingredient_id: Number(line.ingredientId), quantity: quantity, unit_cost: cost })
  }
  return output
}

/** Si alguna línea tiene un número con más decimales o cifras de los que acepta el servidor. */
export function hasInvalidNumbers(lines: readonly LineDraft[]): boolean {
  return hasInvalidLineNumber(lines.map((line) => ({ quantity: line.quantity, cost: line.unitCost })))
}
