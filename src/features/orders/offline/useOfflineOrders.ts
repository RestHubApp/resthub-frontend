import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useRef } from 'react'

import { ordersQueryKey } from '@/api/orders'
import { tablesQueryKey } from '@/api/tables'
import { useNotifications } from '@/store/notifications'
import { belongsTo, ownerOf, queuedOrders, useQueuedOrders } from '@/store/offlineQueue'
import { staffOf, useSession, useStaffAccount } from '@/store/session'
import { deliverQueued } from './deliverQueued'

// Mientras haya pedidos esperando, se reintenta cada medio minuto por si el
// navegador no avisa que volvió la señal (pasa en algunos celulares).
const RETRY_MS = 30_000

/**
 * Los pedidos tomados sin señal y el envío automático al volver la conexión.
 *
 * Cada uno se abre con su `client_request_id` (el servidor no lo duplica) y
 * se manda a cocina; si ya estaba en cocina, el 409 se toma como hecho. Un
 * rechazo de verdad (plato agotado, mesa ocupada) se avisa y sale de la cola.
 */
export function useOfflineOrders() {
  const pending = useQueuedOrders(useStaffAccount())
  const queryClient = useQueryClient()
  const push = useNotifications((state) => state.push)
  const sending = useRef(false)

  const send = useCallback(async () => {
    const owner = ownerOf(staffOf(useSession.getState().account))
    if (sending.current || queuedOrders(owner).length === 0) {
      return
    }
    sending.current = true
    try {
      for (const order of queuedOrders(owner)) {
        // Si la sesión se cerró o cambió de cuenta a mitad de la cola, el
        // token ya no es el de quien tomó el pedido.
        if (!belongsTo(order, ownerOf(staffOf(useSession.getState().account)))) {
          break
        }
        const wasFollowed = await deliverQueued(order, push)
        if (!wasFollowed) {
          break
        }
      }
    } finally {
      sending.current = false
      void queryClient.invalidateQueries({ queryKey: ordersQueryKey })
      void queryClient.invalidateQueries({ queryKey: tablesQueryKey })
    }
  }, [push, queryClient])

  useEffect(() => {
    void send()
    const onBack = () => {
      void send()
    }
    window.addEventListener('online', onBack)
    const timer = window.setInterval(onBack, RETRY_MS)
    return () => {
      window.removeEventListener('online', onBack)
      window.clearInterval(timer)
    }
  }, [send])

  return { pending, send }
}
