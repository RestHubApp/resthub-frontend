import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'

import { dishCostsQueryKey, fetchDishCosts } from '../../api/inventory'
import { fetchMenu, menuListQueryKey } from '../../api/menu'
import type { DishCost } from '../../api/types'
import { useCan } from '../../store/session'

/** La carta completa, con lo desactivado: esta pantalla es la de quien la administra. */
export const MENU_KEY = menuListQueryKey(true)

/**
 * La carta y, si la cuenta puede ver el inventario, el costo de cada plato.
 *
 * El costo sale de las recetas, que son del inventario. Sin ese permiso la
 * carta se muestra igual, solo que sin márgenes.
 */
export function useMenuData() {
  const puedeVerCostos = useCan('inventory.read')
  const menu = useQuery({ queryKey: MENU_KEY, queryFn: () => fetchMenu(true) })
  const costos = useQuery({
    queryKey: dishCostsQueryKey,
    queryFn: fetchDishCosts,
    enabled: puedeVerCostos,
  })

  const costoPorPlato = useMemo(
    () => new Map<number, DishCost>((costos.data ?? []).map((costo) => [costo.menu_item_id, costo])),
    [costos.data],
  )

  return { menu, costoPorPlato, puedeVerCostos }
}
