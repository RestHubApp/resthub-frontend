import type { PurchaseSuggestion } from '../../api/types'

/** Una línea de la orden mientras se escribe, con los textos del formulario. */
export interface LineDraft {
  /** Solo para la lista en pantalla: una línea no tiene identidad hasta guardarse. */
  readonly key: string
  readonly ingredientId: string
  readonly quantity: string
  readonly unitCost: string
}

const NUMERO = /^\d+(?:[.,]\d+)?$/u

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

function numero(valor: string): string | null {
  const limpio = valor.trim().replace(',', '.')
  return NUMERO.test(limpio) ? limpio : null
}

/** Las líneas completas y válidas, o `null` si alguna está a medias. */
export function linesForApi(
  lines: readonly LineDraft[],
): { ingredient_id: number; quantity: string; unit_cost: string }[] | null {
  const completas = lines.filter((line) => line.ingredientId !== '')
  if (completas.length === 0) {
    return null
  }
  const salida = []
  for (const line of completas) {
    const cantidad = numero(line.quantity)
    const costo = numero(line.unitCost === '' ? '0' : line.unitCost)
    if (cantidad === null || costo === null || Number(cantidad) <= 0) {
      return null
    }
    salida.push({ ingredient_id: Number(line.ingredientId), quantity: cantidad, unit_cost: costo })
  }
  return salida
}
