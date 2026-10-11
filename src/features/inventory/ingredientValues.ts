import type { Ingredient, IngredientUnit } from '@/api/types'
import type { IngredientValues } from './inventorySchema'
import { findInputUnit, fromBase, inputUnits, parseDecimal, priceUnit, toBaseCost, toBaseQuantity } from './units'

export const EMPTY_INGREDIENT: IngredientValues = {
  name: '',
  unit: 'g',
  min_stock: '',
  min_stock_unit: 'kg',
  unit_cost: '',
}

/** Los datos de un insumo, en kilos y litros, para editarlos. */
export function ingredientValuesOf(ingredient: Ingredient): IngredientValues {
  const large = inputUnits(ingredient.unit)[0] ?? priceUnit(ingredient.unit)
  const cost = Number(ingredient.unit_cost) * priceUnit(ingredient.unit).factor
  return {
    name: ingredient.name,
    unit: ingredient.unit,
    min_stock: fromBase(ingredient.min_stock, large.factor),
    min_stock_unit: large.value,
    unit_cost: cost > 0 ? fromBase(cost, 1) : '',
  }
}

/** Mínimo y costo llevados a la unidad base. Vacío vale cero. */
export function ingredientNumbers(values: IngredientValues, unit: IngredientUnit) {
  const factor = findInputUnit(unit, values.min_stock_unit).factor
  const cost = values.unit_cost.trim() === '' ? 0 : parseDecimal(values.unit_cost)
  return {
    min_stock: values.min_stock.trim() === '' ? '0' : toBaseQuantity(values.min_stock, factor),
    unit_cost: toBaseCost(cost, priceUnit(unit).factor),
  }
}
