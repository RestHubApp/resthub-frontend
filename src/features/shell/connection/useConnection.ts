import { useSyncExternalStore } from 'react'

import { useLiveStatus, type LiveStatus } from '@/store/liveStatus'
import { useQueuedOrders, type QueuedOrder } from '@/store/offlineQueue'
import { useSendQueuedOrders } from '@/store/queuedDelivery'
import { useStaffAccount } from '@/store/session'

/** `online`: hay red y, si la pantalla tiene canal en vivo, está conectado; `reconnecting`: el canal se cortó; `offline`: sin red. */
export type ConnectionState = 'online' | 'reconnecting' | 'offline'

export interface Connection {
  readonly state: ConnectionState
  /** El canal en vivo de la pantalla, o `null` si la pantalla no tiene uno. */
  readonly live: LiveStatus | null
  /** Los pedidos de esta cuenta que esperan señal. */
  readonly pending: readonly QueuedOrder[]
  /** Reintenta ya el envío de la cola, el mismo que hace la pantalla de pedidos. */
  readonly retry: () => Promise<void>
}

function subscribeNetwork(listener: () => void): () => void {
  window.addEventListener('online', listener)
  window.addEventListener('offline', listener)
  return () => {
    window.removeEventListener('online', listener)
    window.removeEventListener('offline', listener)
  }
}

const hasNetwork = () => navigator.onLine

function connectionState(isOnline: boolean, live: LiveStatus | null): ConnectionState {
  if (!isOnline) {
    return 'offline'
  }
  return live === 'offline' || live === 'connecting' ? 'reconnecting' : 'online'
}

/**
 * Cómo está la conexión de este equipo: la red del navegador, el canal en
 * vivo (`GET /events`) que abren las pantallas de pedidos, cocina y tablero,
 * y la cola de pedidos tomados sin señal. No abre ninguna conexión propia.
 */
export function useConnection(): Connection {
  const isOnline = useSyncExternalStore(subscribeNetwork, hasNetwork, () => true)
  const live = useLiveStatus()
  const pending = useQueuedOrders(useStaffAccount())
  const retry = useSendQueuedOrders()

  return { state: connectionState(isOnline, live), live, pending, retry }
}
