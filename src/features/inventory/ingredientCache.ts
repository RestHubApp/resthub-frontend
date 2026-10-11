import { type QueryClient } from '@tanstack/react-query'

import { ingredientsQuery, inventoryQueryKey, lowStockQuery } from '@/api/inventory'
import type { Ingredient, StockChange } from '@/api/types'
import { byName, removeFromList, upsertInList } from '@/services/cacheList'

/** Lo que devuelven el alta, la edición y los movimientos de un insumo. */
export type IngredientResult = Ingredient | StockChange

function ingredientOf(result: IngredientResult): Ingredient {
  return 'movement' in result ? result.ingredient : result
}

// El orden de las alertas es el del servidor: primero lo negativo, después lo
// que está más lejos del mínimo.
function missingMore(ingredient: Ingredient, other: Ingredient): boolean {
  if (ingredient.is_negative !== other.is_negative) {
    return ingredient.is_negative
  }
  return Number(ingredient.stock) - Number(ingredient.min_stock) < Number(other.stock) - Number(other.min_stock)
}

function withIngredient(list: readonly Ingredient[], ingredient: Ingredient): Ingredient[] {
  if (!ingredient.is_active) {
    return removeFromList(list, ingredient.id)
  }
  return upsertInList(list, ingredient, byName, (previous) => previous.name === ingredient.name)
}

function withAlert(list: readonly Ingredient[], ingredient: Ingredient): Ingredient[] {
  const isFollowing = ingredient.is_active && (ingredient.is_low || ingredient.is_negative)
  return isFollowing ? upsertInList(list, ingredient, missingMore, () => false) : removeFromList(list, ingredient.id)
}

/**
 * Pone el insumo como lo devolvió el servidor en la tabla y en las alertas, y
 * pide releer el resto del inventario de fondo: el libro, los costos de las
 * recetas y las mismas listas, por si otra persona cambió algo.
 */
export function saveIngredient(queryClient: QueryClient, result: IngredientResult): void {
  const ingredient = ingredientOf(result)
  queryClient.setQueryData(ingredientsQuery.queryKey, (list) => list && withIngredient(list, ingredient))
  queryClient.setQueryData(lowStockQuery.queryKey, (list) => list && withAlert(list, ingredient))
  void queryClient.invalidateQueries({ queryKey: inventoryQueryKey })
}
