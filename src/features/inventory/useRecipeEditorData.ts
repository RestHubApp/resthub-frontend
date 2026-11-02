import { useQuery } from '@tanstack/react-query'

import { recipeQuery } from '@/api/inventory'
import { useIngredients } from './useIngredients'

/**
 * La receta de un plato y los insumos, cargados juntos para el editor.
 *
 * El editor parte de lo que hay en el servidor, no de una copia vieja.
 */
export function useRecipeEditorData(menuItemId: number) {
  // Un enlace mal copiado (`/inventario/recetas/abc`) no tiene plato que pedir.
  const isValidId = Number.isInteger(menuItemId) && menuItemId > 0
  const recipe = useQuery({
    ...recipeQuery(menuItemId),
    enabled: isValidId,
    // El editor parte de lo que hay en el servidor, no de una copia vieja.
    staleTime: 0,
  })
  const ingredients = useIngredients()
  const error = recipe.error ?? ingredients.error

  return {
    recipe: recipe.data,
    ingredients: ingredients.data,
    error,
    isMissing: !isValidId,
    isLoading: isValidId && error === null && (recipe.data === undefined || ingredients.data === undefined),
  }
}
