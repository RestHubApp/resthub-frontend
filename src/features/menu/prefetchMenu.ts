import { dishCostsQuery } from '../../api/inventory'
import { prefetch } from '../../services/queryClient'
import { can } from '../../store/session'
import { MENU_QUERY } from './useMenuData'

/** Menú: la carta completa y, si la cuenta ve el inventario, el costo de cada plato. */
export function prefetchMenu(): void {
  if (can('menu.read')) {
    prefetch(MENU_QUERY)
  }
  if (can('inventory.read')) {
    prefetch(dishCostsQuery)
  }
}
