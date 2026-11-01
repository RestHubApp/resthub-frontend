import type { Ingredient, IngredientUnit, PackagingRequest, UpdateIngredientRequest } from '@/api/types'
import type { IngredientValues } from './inventorySchema'
import type { PackagingValues } from './packagingSchema'
import { costForInput, findInputUnit, fromBase, type InputUnit, inputUnits, parseDecimal, priceUnit, toBaseCost, toBaseQuantity } from './units'

const NO_PACKAGING: PackagingValues = {
  packaging_size: '',
  packaging_size_unit: '',
  packaging_label: '',
  packaging_full: '',
  packaging_empty: '',
}

export const EMPTY_INGREDIENT: IngredientValues = {
  name: '',
  unit: 'g',
  min_stock: '',
  min_stock_unit: 'kg',
  unit_cost: '',
  ...NO_PACKAGING,
  packaging_size_unit: 'g',
}

const THOUSAND = 1000

/** En qué unidad se muestra un tamaño: 50000 g en kg; 750 ml, en ml (la base, la última de la lista). */
function sizeUnit(unit: IngredientUnit, size: number): InputUnit {
  const units = inputUnits(unit)
  const base = units.at(-1) ?? priceUnit(unit)
  const isRound = size >= THOUSAND && size % THOUSAND === 0
  return isRound ? (units[0] ?? base) : base
}

function weightOf(value: string | null): string {
  return value === null ? '' : fromBase(value, 1)
}

/** La presentación del insumo para editarla. */
function packagingValuesOf(ingredient: Ingredient): PackagingValues {
  const { packaging, unit } = ingredient
  if (packaging === null) {
    return { ...NO_PACKAGING, packaging_size_unit: sizeUnit(unit, 0).value }
  }
  const size = Number(packaging.size)
  const shown = sizeUnit(unit, size)
  return {
    packaging_size: fromBase(size, shown.factor),
    packaging_size_unit: shown.value,
    packaging_label: packaging.label,
    packaging_full: weightOf(packaging.full_weight_g),
    packaging_empty: weightOf(packaging.empty_weight_g),
  }
}

/** Los datos de un insumo, en kilos y litros, para editarlos. */
export function ingredientValuesOf(ingredient: Ingredient): IngredientValues {
  const large = inputUnits(ingredient.unit)[0] ?? priceUnit(ingredient.unit)
  return {
    name: ingredient.name,
    unit: ingredient.unit,
    min_stock: fromBase(ingredient.min_stock, large.factor),
    min_stock_unit: large.value,
    unit_cost: Number(ingredient.unit_cost) > 0 ? costForInput(ingredient.unit_cost, ingredient.unit) : '',
    ...packagingValuesOf(ingredient),
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

/**
 * La edición de un insumo: el nombre siempre; el mínimo y el costo, solo si se
 * tocaron. Cada compra pondera el costo en el servidor, así que reenviar el que
 * se leyó al abrir pisaría el actual con uno viejo.
 */
export function ingredientChanges(values: IngredientValues, ingredient: Ingredient): UpdateIngredientRequest {
  const original = ingredientValuesOf(ingredient)
  const numbers = ingredientNumbers(values, values.unit)
  const isMinStockChanged = values.min_stock !== original.min_stock || values.min_stock_unit !== original.min_stock_unit
  return {
    name: values.name,
    ...(isMinStockChanged ? { min_stock: numbers.min_stock } : {}),
    ...(values.unit_cost === original.unit_cost ? {} : { unit_cost: numbers.unit_cost }),
  }
}

/** La presentación para el API, en la unidad base; `null` si no se escribió el tamaño (o para quitarla). */
export function packagingRequest(values: PackagingValues, unit: IngredientUnit): PackagingRequest | null {
  if (values.packaging_size.trim() === '') {
    return null
  }
  const factor = findInputUnit(unit, values.packaging_size_unit).factor
  const hasWeights = values.packaging_full.trim() !== '' && values.packaging_empty.trim() !== ''
  return {
    size: toBaseQuantity(values.packaging_size, factor),
    label: values.packaging_label.trim(),
    full_weight_g: hasWeights ? toBaseQuantity(values.packaging_full, 1) : null,
    empty_weight_g: hasWeights ? toBaseQuantity(values.packaging_empty, 1) : null,
  }
}
