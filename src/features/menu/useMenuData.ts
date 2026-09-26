import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'

import { dishCostsQuery } from '../../api/inventory'
import { menuQuery } from '../../api/menu'
import type { DishCost } from '../../api/types'
import { useCan } from '../../store/session'

/** La carta completa, con lo desactivado: esta pantalla es la de quien la administra. */
export const MENU_QUERY = menuQuery(true)
export const MENU_KEY = MENU_QUERY.queryKey

/**
 * La carta y, si la cuenta puede ver el inventario, el costo de cada plato.
 *
 * El costo sale de las recetas, que son del inventario. Sin ese permiso la
 * carta se muestra igual, solo que sin márgenes.
 */
export function useMenuData() {
  const puedeVerCostos = useCan('inventory.read')
  const menu = useQuery(MENU_QUERY)
  const costos = useQuery({ ...dishCostsQuery, enabled: puedeVerCostos })

  const costoPorPlato = useMemo(
    () => new Map<number, DishCost>((costos.data ?? []).map((costo) => [costo.menu_item_id, costo])),
    [costos.data],
  )

  return { menu, costoPorPlato, puedeVerCostos }
}
