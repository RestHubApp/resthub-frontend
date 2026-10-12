import { useQuery } from '@tanstack/react-query'

import { recipeQuery } from '@/api/inventory'
import { useIngredients } from './useIngredients'

/**
 * La receta de un plato y los insumos, cargados juntos para el editor.
 *
 * El editor parte de lo que hay en el servidor, no de una copia vieja.
 */
export function useRecipeEditorData(menuItemId: number) {
  const recipe = useQuery({
    ...recipeQuery(menuItemId),
    enabled: Number.isInteger(menuItemId),
    // El editor parte de lo que hay en el servidor, no de una copia vieja.
    staleTime: 0,
  })
  const ingredients = useIngredients()
  const error = recipe.error ?? ingredients.error

  return {
    recipe: recipe.data,
    ingredients: ingredients.data,
    error,
    isLoading: error === null && (recipe.data === undefined || ingredients.data === undefined),
  }
}
