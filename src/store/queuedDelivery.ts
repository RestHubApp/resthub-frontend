import { useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'

import { advanceOrder, openOrder, ordersQueryKey } from '@/api/orders'
import { tablesQueryKey } from '@/api/tables'
import { errorMessage, hasCode, isSessionEnded, isSessionLocked, isUnreachable } from '@/services/apiError'
import { useNotifications } from '@/store/notifications'
import { belongsTo, ownerOf, queuedOrders, removeQueued, type QueuedOrder } from '@/store/offlineQueue'
import { staffOf, useSession } from '@/store/session'

/** Avisa al mesero lo que paso con un pedido de la cola. */
type NotifyQueued = (toast: { tone: 'info' | 'warning'; message: string }) => void

/** Abre el pedido y lo manda a cocina; si ya estaba en cocina (`invalid_transition`), vale como hecho. */
async function sendQueued(order: QueuedOrder): Promise<number> {
  const open = await openOrder(order.request)
  await advanceOrder(open.id, 'send').catch((error: unknown) => {
    if (!hasCode(error, 'invalid_transition')) {
      throw error
    }
  })
  return open.number
}

// Si el servidor no explica el 429, el aviso dice igual qué hacer.
const RATE_LIMITED_MESSAGE = 'hay demasiadas peticiones seguidas; espera un momento y pulsa «Reintentar».'

/**
 * Si el fallo se arregla esperando y no es un rechazo del pedido: sin señal o
 * el servidor caído, el límite de peticiones seguidas (429 `rate_limited`) o la
 * sesión vencida o bloqueada (vuelve a salir cuando esa cuenta entre o la
 * desbloquee). Reenviarlo es seguro: el servidor lo reconoce por su
 * `client_request_id` y no abre otro.
 */
function shouldWaitAndRetry(error: unknown): boolean {
  return isUnreachable(error) || hasCode(error, 'rate_limited') || isSessionEnded(error) || isSessionLocked(error)
}

/**
 * Entrega un pedido de la cola y avisa el resultado.
 *
 * Devuelve `true` si la cola puede seguir con el siguiente (se envio o fue un
 * rechazo de verdad y salio de la cola) y `false` si hay que cortar y
 * reintentar despues (sin señal, el límite de peticiones o la sesion vencida).
 */
async function deliverQueued(order: QueuedOrder, notify: NotifyQueued): Promise<boolean> {
  const requestId = order.request.client_request_id ?? ''
  try {
    const number = await sendQueued(order)
    removeQueued(requestId)
    notify({ tone: 'info', message: `${order.label}: pedido #${String(number)} enviado a cocina.` })
    return true
  } catch (error: unknown) {
    if (shouldWaitAndRetry(error)) {
      // Con el límite de peticiones la señal no se perdió y no llega un evento
      // «online» que lo reintente: se avisa para que el mesero reintente en un momento.
      if (hasCode(error, 'rate_limited')) {
        notify({ tone: 'warning', message: `${order.label}: ${errorMessage(error, RATE_LIMITED_MESSAGE)}` })
      }
      return false
    }
    removeQueued(requestId)
    notify({ tone: 'warning', message: `${order.label}: ${errorMessage(error, 'no se pudo enviar.')}` })
    return true
  }
}

// Uno solo a la vez en toda la pestaña: el aviso de la pantalla de pedidos y
// el indicador de conexión del armazón pueden pedir el envío al mismo tiempo.
const sending = { current: false }

/**
 * Envía en orden los pedidos en cola de la cuenta activa, hasta el primero que
 * no pasa. Devuelve `false` si no había nada que enviar o ya se estaba enviando.
 */
async function sendQueuedOrders(notify: NotifyQueued): Promise<boolean> {
  const owner = ownerOf(staffOf(useSession.getState().account))
  if (sending.current || queuedOrders(owner).length === 0) {
    return false
  }
  sending.current = true
  try {
    for (const order of queuedOrders(owner)) {
      // Si la sesión se cerró o cambió de cuenta a mitad de la cola, el
      // token ya no es el de quien tomó el pedido.
      if (!belongsTo(order, ownerOf(staffOf(useSession.getState().account)))) {
        break
      }
      const wasFollowed = await deliverQueued(order, notify)
      if (!wasFollowed) {
        break
      }
    }
  } finally {
    sending.current = false
  }
  return true
}

/**
 * El envío de la cola sin señal, para reintentar a mano o al volver la
 * conexión. Al terminar vuelve a pedir pedidos y mesas: cambiaron.
 */
export function useSendQueuedOrders(): () => Promise<void> {
  const queryClient = useQueryClient()
  const push = useNotifications((state) => state.push)

  return useCallback(async () => {
    const hasSent = await sendQueuedOrders(push)
    if (hasSent) {
      void queryClient.invalidateQueries({ queryKey: ordersQueryKey })
      void queryClient.invalidateQueries({ queryKey: tablesQueryKey })
    }
  }, [push, queryClient])
}
