import type { Ingredient, IngredientUnit, Recipe } from '../../api/types'
import type { RecipeValues } from './inventorySchema'
import { fromBase, parseDecimal } from './units'

/** Lo que el editor necesita saber de un insumo para mostrar y costear una línea. */
export interface RecipeIngredient {
  readonly id: number
  readonly name: string
  readonly unit: IngredientUnit
  readonly unitCost: number
}

/**
 * Los insumos que puede usar la receta, por id.
 *
 * El costo es el actual del insumo. Una línea con un insumo que ya no está
 * activo no aparece en la lista de insumos: se toma de la propia receta.
 */
export function recipeCatalog(
  ingredients: readonly Ingredient[],
  recipe: Recipe,
): ReadonlyMap<number, RecipeIngredient> {
  const catalogo = new Map<number, RecipeIngredient>()
  for (const linea of recipe.lines) {
    catalogo.set(linea.ingredient_id, {
      id: linea.ingredient_id,
      name: linea.ingredient_name,
      unit: linea.unit,
      unitCost: Number(linea.unit_cost),
    })
  }
  for (const insumo of ingredients) {
    catalogo.set(insumo.id, {
      id: insumo.id,
      name: insumo.name,
      unit: insumo.unit,
      unitCost: Number(insumo.unit_cost),
    })
  }
  return catalogo
}

export function recipeValuesOf(recipe: Recipe): RecipeValues {
  return {
    lines: recipe.lines.map((linea) => ({
      ingredient_id: linea.ingredient_id,
      quantity: fromBase(linea.quantity, 1),
    })),
  }
}

/** El costo de una línea mientras se escribe; cero si la cantidad todavía no es un número. */
export function lineCost(quantity: string, ingredient: RecipeIngredient | undefined): number {
  const cantidad = parseDecimal(quantity)
  if (ingredient === undefined || !Number.isFinite(cantidad)) {
    return 0
  }
  return cantidad * ingredient.unitCost
}

export function recipeCost(
  lines: RecipeValues['lines'],
  catalog: ReadonlyMap<number, RecipeIngredient>,
): number {
  return lines.reduce((total, linea) => total + lineCost(linea.quantity, catalog.get(linea.ingredient_id)), 0)
}

/** Los insumos activos que todavía no están en la receta, para agregarlos. */
export function availableIngredients(
  ingredients: readonly Ingredient[],
  lines: RecipeValues['lines'],
  catalog: ReadonlyMap<number, RecipeIngredient>,
): RecipeIngredient[] {
  const usados = new Set(lines.map((linea) => linea.ingredient_id))
  return ingredients
    .filter((insumo) => !usados.has(insumo.id))
    .map((insumo) => catalog.get(insumo.id))
    .filter((insumo) => insumo !== undefined)
}

/** El cuerpo de `PUT /inventory/recipes/{id}`, con las cantidades como texto decimal. */
export function recipePayload(values: RecipeValues) {
  return {
    lines: values.lines.map((linea) => ({
      ingredient_id: linea.ingredient_id,
      quantity: linea.quantity.trim().replace(',', '.'),
    })),
  }
}
