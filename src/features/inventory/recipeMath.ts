import type { Ingredient, IngredientUnit, Recipe } from '@/api/types'
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
  const catalog = new Map<number, RecipeIngredient>()
  for (const line of recipe.lines) {
    catalog.set(line.ingredient_id, {
      id: line.ingredient_id,
      name: line.ingredient_name,
      unit: line.unit,
      unitCost: Number(line.unit_cost),
    })
  }
  for (const ingredient of ingredients) {
    catalog.set(ingredient.id, {
      id: ingredient.id,
      name: ingredient.name,
      unit: ingredient.unit,
      unitCost: Number(ingredient.unit_cost),
    })
  }
  return catalog
}

export function recipeValuesOf(recipe: Recipe): RecipeValues {
  return {
    lines: recipe.lines.map((line) => ({
      ingredient_id: line.ingredient_id,
      quantity: fromBase(line.quantity, 1),
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
  return lines.reduce((total, line) => total + lineCost(line.quantity, catalog.get(line.ingredient_id)), 0)
}

/** Los insumos activos que todavía no están en la receta, para agregarlos. */
export function availableIngredients(
  ingredients: readonly Ingredient[],
  lines: RecipeValues['lines'],
  catalog: ReadonlyMap<number, RecipeIngredient>,
): RecipeIngredient[] {
  const used = new Set(lines.map((line) => line.ingredient_id))
  return ingredients
    .filter((ingredient) => !used.has(ingredient.id))
    .map((ingredient) => catalog.get(ingredient.id))
    .filter((ingredient) => ingredient !== undefined)
}

/** El cuerpo de `PUT /inventory/recipes/{id}`, con las cantidades como texto decimal. */
export function recipePayload(values: RecipeValues) {
  return {
    lines: values.lines.map((line) => ({
      ingredient_id: line.ingredient_id,
      quantity: line.quantity.trim().replace(',', '.'),
    })),
  }
}
