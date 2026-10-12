import { useMutation, useQueryClient } from '@tanstack/react-query'

import { createCategory, menuQueryKey, updateCategory } from '@/api/menu'
import type { MenuCategory } from '@/api/types'
import { withCategory } from './menuCache'
import type { CategoryValues } from './menuSchema'
import { MENU_KEY } from './useMenuData'

/**
 * Crea o edita una categoría (edita si recibe `category`).
 *
 * Al guardar pone la categoría en la carta en caché y relee la carta de fondo.
 */
export function useSaveCategory(category: MenuCategory | undefined, onDone: () => void) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (values: CategoryValues) =>
      category === undefined ? createCategory(values) : updateCategory(category.id, values),
    onSuccess: (createdCategory) => {
      queryClient.setQueryData(MENU_KEY, (menu) => menu && withCategory(menu, createdCategory))
      void queryClient.invalidateQueries({ queryKey: menuQueryKey })
      onDone()
    },
  })
}
