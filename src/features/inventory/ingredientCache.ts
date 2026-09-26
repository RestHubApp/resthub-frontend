import { type QueryClient } from '@tanstack/react-query'

import { ingredientsQuery, inventoryQueryKey, lowStockQuery } from '../../api/inventory'
import type { Ingredient, StockChange } from '../../api/types'
import { byName, removeFromList, upsertInList } from '../../services/cacheList'

/** Lo que devuelven el alta, la edición y los movimientos de un insumo. */
export type IngredientResult = Ingredient | StockChange

function insumoDe(resultado: IngredientResult): Ingredient {
  return 'movement' in resultado ? resultado.ingredient : resultado
}

// El orden de las alertas es el del servidor: primero lo negativo, después lo
// que está más lejos del mínimo.
function faltaMas(insumo: Ingredient, otro: Ingredient): boolean {
  if (insumo.is_negative !== otro.is_negative) {
    return insumo.is_negative
  }
  return Number(insumo.stock) - Number(insumo.min_stock) < Number(otro.stock) - Number(otro.min_stock)
}

function conInsumo(lista: readonly Ingredient[], insumo: Ingredient): Ingredient[] {
  if (!insumo.is_active) {
    return removeFromList(lista, insumo.id)
  }
  return upsertInList(lista, insumo, byName, (previo) => previo.name === insumo.name)
}

function conAlerta(lista: readonly Ingredient[], insumo: Ingredient): Ingredient[] {
  const sigue = insumo.is_active && (insumo.is_low || insumo.is_negative)
  return sigue ? upsertInList(lista, insumo, faltaMas, () => false) : removeFromList(lista, insumo.id)
}

/**
 * Pone el insumo como lo devolvió el servidor en la tabla y en las alertas, y
 * pide releer el resto del inventario de fondo: el libro, los costos de las
 * recetas y las mismas listas, por si otra persona cambió algo.
 */
export function saveIngredient(queryClient: QueryClient, resultado: IngredientResult): void {
  const insumo = insumoDe(resultado)
  queryClient.setQueryData(ingredientsQuery.queryKey, (lista) => lista && conInsumo(lista, insumo))
  queryClient.setQueryData(lowStockQuery.queryKey, (lista) => lista && conAlerta(lista, insumo))
  void queryClient.invalidateQueries({ queryKey: inventoryQueryKey })
}
