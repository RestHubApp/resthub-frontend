import type { QueryClient } from '@tanstack/react-query'

import { currentUserQueryKey } from '@/api/auth'
import { cashQueryKey } from '@/api/cash'
import { orderNotesQueryKey } from '@/api/insights'
import { menuQueryKey } from '@/api/menu'
import { ordersQueryKey } from '@/api/orders'
import { tablesQueryKey } from '@/api/tables'

// Un aviso dice que cambio, nunca los datos: se invalidan las consultas y
// TanStack Query vuelve a pedir solo las que estan en pantalla.
const KEYS_BY_TOPIC: Readonly<Record<string, readonly (readonly unknown[])[]>> = {
  orders: [ordersQueryKey, tablesQueryKey, cashQueryKey],
  // Se abrió o se cerró la caja: el cobro sabe si puede cobrar.
  cash: [cashQueryKey],
  menu: [menuQueryKey],
  permissions: [currentUserQueryKey],
  // Solo llega al encargado: se clasificaron las notas de un pedido.
  insights: [orderNotesQueryKey],
}
const EVERYTHING = [ordersQueryKey, tablesQueryKey, menuQueryKey, orderNotesQueryKey, cashQueryKey] as const

function invalidate(queryClient: QueryClient, keys: readonly (readonly unknown[])[]): void {
  for (const queryKey of keys) {
    void queryClient.invalidateQueries({ queryKey })
  }
}

/**
 * Arma el manejador de avisos del canal en vivo.
 *
 * Con `ready` marca el canal como activo y, si ya habia estado conectado (es
 * una reconexion), vuelve a pedir lo que estaba en pantalla: pudo perderse un aviso en el corte.
 * Cualquier otro aviso invalida solo las consultas de su tema.
 */
export function createLiveEventHandler(queryClient: QueryClient, onReady: () => void): (event: { type: string }) => void {
  let hasConnected = false
  return (event) => {
    if (event.type !== 'ready') {
      invalidate(queryClient, KEYS_BY_TOPIC[event.type] ?? [])
      return
    }
    onReady()
    if (hasConnected) {
      invalidate(queryClient, EVERYTHING)
    }
    hasConnected = true
  }
}
