import { useMutation, useQueryClient } from '@tanstack/react-query'

import { dishCostsQueryKey } from '@/api/inventory'
import { createMenuItem, menuQueryKey, updateMenuItem } from '@/api/menu'
import type { MenuItem } from '@/api/types'
import { withItem } from './menuCache'
import { menuItemPayload, type MenuItemValues } from './menuSchema'
import type { ParsedGroup } from './modifierDrafts'
import { MENU_KEY } from './useMenuData'

/**
 * Crea o edita un plato con sus grupos de opciones (edita si recibe `item`).
 *
 * Al guardar pone el plato en la carta en caché y relee de fondo la carta y
 * los costos.
 */
export function useSaveMenuItem(item: MenuItem | undefined, onDone: () => void) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (values: MenuItemValues & { modifier_groups: ParsedGroup[] }) => {
      const body = { ...menuItemPayload(values), modifier_groups: values.modifier_groups }
      // Un plato nuevo entra disponible: se crea para venderlo.
      return item === undefined
        ? createMenuItem({ ...body, is_available: true })
        : updateMenuItem(item.id, body)
    },
    onSuccess: (dish) => {
      queryClient.setQueryData(MENU_KEY, (menu) => menu && withItem(menu, dish))
      // La carta del mesero y el margen, que se calcula en el inventario con
      // el precio, se releen de fondo.
      void queryClient.invalidateQueries({ queryKey: menuQueryKey })
      void queryClient.invalidateQueries({ queryKey: dishCostsQueryKey })
      onDone()
    },
  })
}
