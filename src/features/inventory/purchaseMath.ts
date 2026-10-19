import type { Ingredient, PurchaseRequest } from '@/api/types'
import type { PurchaseValues } from './inventorySchema'
import { PACKAGE_UNIT, packageUnit, roundQuantity } from './packaging'
import { fromBase, type InputUnit, inputUnits, parseDecimal, priceUnit, toBaseCost, toBaseQuantity } from './units'
import { formatMoney, formatQuantity } from '@/services/format'

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
export function purchaseMath(values: PurchaseValues, ingredient: Ingredient): PurchaseMath | null {
  const { unit } = ingredient
  const factor = purchaseUnit(ingredient, values.quantity_unit).factor
  const quantity = roundQuantity(parseDecimal(values.quantity) * factor)
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

/** Las unidades en que se escribe una compra: kg y g (o L y ml) y, si tiene presentación, el envase. */
export function purchaseUnits(ingredient: Ingredient): readonly InputUnit[] {
  const units = inputUnits(ingredient.unit)
  return ingredient.packaging === null ? units : [...units, packageUnit(ingredient.packaging)]
}

function purchaseUnit(ingredient: Ingredient, value: string): InputUnit {
  return purchaseUnits(ingredient).find((option) => option.value === value) ?? { value, label: value, factor: 1 }
}

/**
 * El cuerpo de `POST /inventory/purchases`.
 *
 * En envases, `quantity` es cuántos y el backend la multiplica por el tamaño;
 * si no, va en la unidad base. El costo va siempre por unidad base: S/ 30 la
 * botella de 750 ml son S/ 0.04 el mililitro.
 */
export function purchasePayload(values: PurchaseValues, ingredient: Ingredient): PurchaseRequest {
  const isPackages = values.quantity_unit === PACKAGE_UNIT
  const factor = purchaseUnit(ingredient, values.quantity_unit).factor
  const baseQuantity = toBaseQuantity(values.quantity, factor)
  const cost = parseDecimal(values.cost)
  const unitCost =
    values.cost_mode === 'unit'
      ? toBaseCost(cost, priceUnit(ingredient.unit).factor)
      : toBaseCost(cost, Number(baseQuantity))
  return {
    ingredient_id: ingredient.id,
    entry_mode: isPackages ? 'packages' : 'base',
    quantity: isPackages ? toBaseQuantity(values.quantity, 1) : baseQuantity,
    unit_cost: unitCost,
    reason: values.reason,
  }
}

/** «4 × botella = 3 L», mientras se compra en envases; nada en kg o g. */
export function packageHint(values: PurchaseValues, ingredient: Ingredient): string | undefined {
  const count = parseDecimal(values.quantity)
  if (values.quantity_unit !== PACKAGE_UNIT || ingredient.packaging === null || !positive(count)) {
    return undefined
  }
  const unit = packageUnit(ingredient.packaging)
  return `${fromBase(count, 1)} × ${unit.label} de ${formatQuantity(unit.factor, ingredient.unit)} = ${formatQuantity(roundQuantity(count * unit.factor), ingredient.unit)}`
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
