import { useMutation, useQueryClient } from '@tanstack/react-query'

import { dishCostsQueryKey, replaceRecipe } from '@/api/inventory'
import type { Recipe } from '@/api/types'
import { useNotifications } from '@/store/notifications'
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
    mutationFn: (values: RecipeValues) => replaceRecipe(menuItemId, recipePayload(values)),
    onSuccess: async (fresh) => {
      onSaved(fresh)
      await queryClient.invalidateQueries({ queryKey: dishCostsQueryKey })
      const action = fresh.has_recipe ? 'guardada' : 'borrada'
      push({ tone: 'info', message: `Receta de ${fresh.menu_item_name} ${action}.` })
    },
  })
}
