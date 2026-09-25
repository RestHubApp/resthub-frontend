import { useMutation, useQueryClient } from '@tanstack/react-query'

import { dishCostsQueryKey, replaceRecipe } from '../../api/inventory'
import type { Recipe } from '../../api/types'
import { useNotifications } from '../../store/notifications'
import type { RecipeValues } from './inventorySchema'
import { recipePayload } from './recipeMath'

/**
 * Guarda la receta entera y refresca los márgenes.
 *
 * `onSaved` recibe la receta como quedó en el servidor, para que el editor
 * parta de ella y deje de marcar cambios pendientes.
 */
export function useSaveRecipe(menuItemId: number, onSaved: (recipe: Recipe) => void) {
  const queryClient = useQueryClient()
  const push = useNotifications((state) => state.push)

  return useMutation({
    mutationFn: (valores: RecipeValues) => replaceRecipe(menuItemId, recipePayload(valores)),
    onSuccess: async (nueva) => {
      onSaved(nueva)
      await queryClient.invalidateQueries({ queryKey: dishCostsQueryKey })
      const accion = nueva.has_recipe ? 'guardada' : 'borrada'
      push({ tone: 'info', message: `Receta de ${nueva.menu_item_name} ${accion}.` })
    },
  })
}
