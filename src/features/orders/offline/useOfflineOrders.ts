import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useRef, useSyncExternalStore } from 'react'

import { advanceOrder, openOrder, ordersQueryKey } from '../../../api/orders'
import { tablesQueryKey } from '../../../api/tables'
import { errorMessage, errorStatus } from '../../../services/api'
import { useNotifications } from '../../../store/notifications'
import { type QueuedOrder, queuedOrders, removeQueued, subscribeQueue } from './offlineQueue'

const CONFLICT = 409
// Mientras haya pedidos esperando, se reintenta cada medio minuto por si el
// navegador no avisa que volvió la señal (pasa en algunos celulares).
const RETRY_MS = 30_000

// El servidor no llegó a atender: el proxy delante responde por él.
const SERVER_UNREACHABLE = new Set([502, 503, 504])

/**
 * Sin respuesta del servidor: no hay señal, se cortó o el servidor no está.
 * Vale reintentar, porque el pedido lleva su id y no se duplica.
 */
export function isOffline(error: unknown): boolean {
  const status = errorStatus(error)
  return status === undefined || SERVER_UNREACHABLE.has(status)
}

/** Abre el pedido y lo manda a cocina; si ya estaba en cocina, el 409 vale como hecho. */
async function sendQueued(pedido: QueuedOrder): Promise<number> {
  const abierto = await openOrder(pedido.request)
  await advanceOrder(abierto.id, 'send').catch((error: unknown) => {
    if (errorStatus(error) !== CONFLICT) {
      throw error
    }
  })
  return abierto.number
}

/**
 * Los pedidos tomados sin señal y el envío automático al volver la conexión.
 *
 * Cada uno se abre con su `client_request_id` (el servidor no lo duplica) y
 * se manda a cocina; si ya estaba en cocina, el 409 se toma como hecho. Un
 * rechazo de verdad (plato agotado, mesa ocupada) se avisa y sale de la cola.
 */
export function useOfflineOrders() {
  const pendientes = useSyncExternalStore(subscribeQueue, queuedOrders)
  const queryClient = useQueryClient()
  const push = useNotifications((state) => state.push)
  const enviando = useRef(false)

  const enviar = useCallback(async () => {
    if (enviando.current || queuedOrders().length === 0) {
      return
    }
    enviando.current = true
    try {
      for (const pedido of queuedOrders()) {
        const siguio = await sendQueued(pedido).then(
          (numero) => {
            removeQueued(pedido.request.client_request_id ?? '')
            push({ tone: 'info', message: `${pedido.label}: pedido #${String(numero)} enviado a cocina.` })
            return true
          },
          (error: unknown) => {
            // Sin señal se corta y se reintenta después; un rechazo sale de la cola.
            if (isOffline(error)) {
              return false
            }
            removeQueued(pedido.request.client_request_id ?? '')
            push({ tone: 'warning', message: `${pedido.label}: ${errorMessage(error, 'no se pudo enviar.')}` })
            return true
          },
        )
        if (!siguio) {
          break
        }
      }
    } finally {
      enviando.current = false
      void queryClient.invalidateQueries({ queryKey: ordersQueryKey })
      void queryClient.invalidateQueries({ queryKey: tablesQueryKey })
    }
  }, [push, queryClient])

  useEffect(() => {
    void enviar()
    const alVolver = () => {
      void enviar()
    }
    window.addEventListener('online', alVolver)
    const timer = window.setInterval(alVolver, RETRY_MS)
    return () => {
      window.removeEventListener('online', alVolver)
      window.clearInterval(timer)
    }
  }, [enviar])

  return { pendientes, enviar }
}
