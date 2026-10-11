import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'

import { activeOrdersQuery } from '@/api/orders'
import { useAllergyFlags } from './useAllergyFlags'

/**
 * Los pedidos en curso con las alergias de sus notas.
 *
 * Lo comparten el tablero y la pantalla de cocina: devuelve la consulta
 * (para sus estados de carga y error), la lista estable de pedidos y `flagFor`.
 */
export function useActiveOrders() {
  const active = useQuery(activeOrdersQuery)
  const orders = useMemo(() => active.data ?? [], [active.data])
  const ids = useMemo(() => orders.map((order) => order.id), [orders])
  const notes = useAllergyFlags(ids)
  return { active, orders, flagFor: notes.flagFor }
}
