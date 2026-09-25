import type { Ingredient, IngredientUnit } from '../../api/types'
import { formatMoney } from '../../services/money'
import type { PurchaseValues } from './inventorySchema'
import {
  findInputUnit,
  fromBase,
  inputUnits,
  parseDecimal,
  priceUnit,
  toBaseCost,
  toBaseQuantity,
} from './units'

function positivo(numero: number): boolean {
  return Number.isFinite(numero) && numero > 0
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
  const cantidad = parseDecimal(values.quantity) * factor
  const costo = parseDecimal(values.cost)
  if (!positivo(cantidad) || !positivo(costo)) {
    return null
  }
  const precio = priceUnit(unit).factor
  if (values.cost_mode === 'unit') {
    return { baseQuantity: cantidad, pricePerUnit: costo, total: (costo * cantidad) / precio }
  }
  return { baseQuantity: cantidad, pricePerUnit: (costo / cantidad) * precio, total: costo }
}

/** El cuerpo de `POST /inventory/purchases`, en la unidad base. */
export function purchasePayload(ingredientId: number, values: PurchaseValues, unit: IngredientUnit) {
  const factor = findInputUnit(unit, values.quantity_unit).factor
  const cantidad = toBaseQuantity(values.quantity, factor)
  const costo = parseDecimal(values.cost)
  const unitCost =
    values.cost_mode === 'unit'
      ? toBaseCost(costo, priceUnit(unit).factor)
      : toBaseCost(costo, Number(cantidad))
  return { ingredient_id: ingredientId, quantity: cantidad, unit_cost: unitCost, reason: values.reason }
}

/** Se propone el costo que ya tiene el insumo: casi siempre se repite. */
export function purchaseDefaults(ingredient: Ingredient): PurchaseValues {
  const costo = Number(ingredient.unit_cost) * priceUnit(ingredient.unit).factor
  return {
    quantity: '',
    quantity_unit: inputUnits(ingredient.unit)[0]?.value ?? ingredient.unit,
    cost_mode: 'unit',
    cost: costo > 0 ? fromBase(costo, 1) : '',
    reason: '',
  }
}

export function costLabel(mode: PurchaseValues['cost_mode'], unitLabel: string): string {
  return mode === 'total' ? 'Total pagado (S/)' : `Costo por ${unitLabel} (S/)`
}

/** "Total S/ 21.00 · sale a S/ 4.20 por kg", o nada mientras falte un dato. */
export function costHint(cuentas: PurchaseMath | null, unitLabel: string): string | undefined {
  if (cuentas === null) {
    return undefined
  }
  return `Total ${formatMoney(cuentas.total)} · sale a ${formatMoney(cuentas.pricePerUnit)} por ${unitLabel}`
}
