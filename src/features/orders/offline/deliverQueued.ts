import { advanceOrder, openOrder } from '@/api/orders'
import { errorMessage, hasCode, isSessionEnded } from '@/services/apiError'
import { isOffline } from '@/features/orders/isOffline'
import { removeQueued, type QueuedOrder } from '@/store/offlineQueue'

/** Avisa al mesero lo que paso con un pedido de la cola. */
export type NotifyQueued = (toast: { tone: 'info' | 'warning'; message: string }) => void

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

/**
 * Entrega un pedido de la cola y avisa el resultado.
 *
 * Devuelve `true` si la cola puede seguir con el siguiente (se envio o fue un
 * rechazo de verdad y salio de la cola) y `false` si hay que cortar y
 * reintentar despues (sin señal o sesion vencida).
 */
export async function deliverQueued(order: QueuedOrder, notify: NotifyQueued): Promise<boolean> {
  const requestId = order.request.client_request_id ?? ''
  try {
    const number = await sendQueued(order)
    removeQueued(requestId)
    notify({ tone: 'info', message: `${order.label}: pedido #${String(number)} enviado a cocina.` })
    return true
  } catch (error: unknown) {
    // Sin señal se corta y se reintenta después, igual que con la sesión
    // vencida: vuelve a salir cuando esa cuenta entre. Un rechazo sale de la cola.
    if (isOffline(error) || isSessionEnded(error)) {
      return false
    }
    removeQueued(requestId)
    notify({ tone: 'warning', message: `${order.label}: ${errorMessage(error, 'no se pudo enviar.')}` })
    return true
  }
}
