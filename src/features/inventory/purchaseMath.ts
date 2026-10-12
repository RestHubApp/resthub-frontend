import type { Ingredient, IngredientUnit } from '@/api/types'
import type { PurchaseValues } from './inventorySchema'
import { findInputUnit, fromBase, inputUnits, parseDecimal, priceUnit, toBaseCost, toBaseQuantity } from './units'
import { formatMoney } from '@/services/format'

function positive(number: number): boolean {
  return Number.isFinite(number) && number > 0
}

export interface PurchaseMath {
  /** La cantidad en la unidad base. */
  readonly baseQuantity: number
  /** El costo por kilo, litro o unidad. */
  readonly pricePerUnit: number
  readonly total: number
}

/**
 * Las cuentas de una compra, a partir de lo que se escribió.
 *
 * Se puede escribir el costo por kilo o lo que se pagó en total: el otro sale
 * de la cantidad. `null` mientras falte un dato o no sea un número.
 */
export function purchaseMath(values: PurchaseValues, unit: IngredientUnit): PurchaseMath | null {
  const factor = findInputUnit(unit, values.quantity_unit).factor
  const quantity = parseDecimal(values.quantity) * factor
  const cost = parseDecimal(values.cost)
  if (!positive(quantity) || !positive(cost)) {
    return null
  }
  const price = priceUnit(unit).factor
  if (values.cost_mode === 'unit') {
    return { baseQuantity: quantity, pricePerUnit: cost, total: (cost * quantity) / price }
  }
  return { baseQuantity: quantity, pricePerUnit: (cost / quantity) * price, total: cost }
}

/** El cuerpo de `POST /inventory/purchases`, en la unidad base. */
export function purchasePayload(ingredientId: number, values: PurchaseValues, unit: IngredientUnit) {
  const factor = findInputUnit(unit, values.quantity_unit).factor
  const quantity = toBaseQuantity(values.quantity, factor)
  const cost = parseDecimal(values.cost)
  const unitCost =
    values.cost_mode === 'unit'
      ? toBaseCost(cost, priceUnit(unit).factor)
      : toBaseCost(cost, Number(quantity))
  return { ingredient_id: ingredientId, quantity: quantity, unit_cost: unitCost, reason: values.reason }
}

/** Se propone el costo que ya tiene el insumo: casi siempre se repite. */
export function purchaseDefaults(ingredient: Ingredient): PurchaseValues {
  const cost = Number(ingredient.unit_cost) * priceUnit(ingredient.unit).factor
  return {
    quantity: '',
    quantity_unit: inputUnits(ingredient.unit)[0]?.value ?? ingredient.unit,
    cost_mode: 'unit',
    cost: cost > 0 ? fromBase(cost, 1) : '',
    reason: '',
  }
}

export function costLabel(mode: PurchaseValues['cost_mode'], unitLabel: string): string {
  return mode === 'total' ? 'Total pagado (S/)' : `Costo por ${unitLabel} (S/)`
}

/** "Total S/ 21.00 · sale a S/ 4.20 por kg", o nada mientras falte un dato. */
export function costHint(accounts: PurchaseMath | null, unitLabel: string): string | undefined {
  if (accounts === null) {
    return undefined
  }
  return `Total ${formatMoney(accounts.total)} · sale a ${formatMoney(accounts.pricePerUnit)} por ${unitLabel}`
}
