import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useRef } from 'react'

import { advanceOrder, openOrder, ordersQueryKey } from '@/api/orders'
import { tablesQueryKey } from '@/api/tables'
import { errorMessage, errorStatus } from '@/services/api'
import { useNotifications } from '@/store/notifications'
import { belongsTo, ownerOf, type QueuedOrder, queuedOrders, removeQueued, useQueuedOrders } from '@/store/offlineQueue'
import { useSession } from '@/store/session'
import { isOffline } from '@/features/orders/isOffline'

const CONFLICT = 409
const UNAUTHORIZED = 401
// Mientras haya pedidos esperando, se reintenta cada medio minuto por si el
// navegador no avisa que volvió la señal (pasa en algunos celulares).
const RETRY_MS = 30_000

/** Abre el pedido y lo manda a cocina; si ya estaba en cocina, el 409 vale como hecho. */
async function sendQueued(order: QueuedOrder): Promise<number> {
  const open = await openOrder(order.request)
  await advanceOrder(open.id, 'send').catch((error: unknown) => {
    if (errorStatus(error) !== CONFLICT) {
      throw error
    }
  })
  return open.number
}

/**
 * Los pedidos tomados sin señal y el envío automático al volver la conexión.
 *
 * Cada uno se abre con su `client_request_id` (el servidor no lo duplica) y
 * se manda a cocina; si ya estaba en cocina, el 409 se toma como hecho. Un
 * rechazo de verdad (plato agotado, mesa ocupada) se avisa y sale de la cola.
 */
export function useOfflineOrders() {
  const pending = useQueuedOrders(useSession((state) => state.account))
  const queryClient = useQueryClient()
  const push = useNotifications((state) => state.push)
  const sending = useRef(false)

  const send = useCallback(async () => {
    const owner = ownerOf(useSession.getState().account)
    if (sending.current || queuedOrders(owner).length === 0) {
      return
    }
    sending.current = true
    try {
      for (const order of queuedOrders(owner)) {
        // Si la sesión se cerró o cambió de cuenta a mitad de la cola, el
        // token ya no es el de quien tomó el pedido.
        if (!belongsTo(order, ownerOf(useSession.getState().account))) {
          break
        }
        const wasFollowed = await sendQueued(order).then(
          (number) => {
            removeQueued(order.request.client_request_id ?? '')
            push({ tone: 'info', message: `${order.label}: pedido #${String(number)} enviado a cocina.` })
            return true
          },
          (error: unknown) => {
            // Sin señal se corta y se reintenta después, igual que con la sesión
            // vencida: vuelve a salir cuando esa cuenta entre. Un rechazo sale de la cola.
            if (isOffline(error) || errorStatus(error) === UNAUTHORIZED) {
              return false
            }
            removeQueued(order.request.client_request_id ?? '')
            push({ tone: 'warning', message: `${order.label}: ${errorMessage(error, 'no se pudo enviar.')}` })
            return true
          },
        )
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
