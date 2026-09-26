import type { OpenOrderRequest } from '../../../api/types'

// Los pedidos que el mesero tomó sin señal, a la espera de enviarse.
//
// Viven en `localStorage` para sobrevivir a cerrar la app o que el celular se
// apague. Cada uno lleva el `client_request_id` con que se va a abrir: si el
// envío llegó al servidor pero la respuesta se perdió, el reintento devuelve
// el mismo pedido en vez de duplicarlo.

const STORAGE_KEY = 'resthub.pedidos-sin-enviar.v1'

export interface QueuedOrder {
  readonly request: OpenOrderRequest
  /** Cuándo se tomó, para mostrarlo y enviarlos en orden. */
  readonly queuedAt: string
  /** Un texto corto para el aviso: «Mesa 3», «Delivery · Ana». */
  readonly label: string
}

type Listener = () => void
const listeners = new Set<Listener>()
const EMPTY: readonly QueuedOrder[] = []
const cache: { value: readonly QueuedOrder[] | null } = { value: null }

function read(): readonly QueuedOrder[] {
  if (cache.value !== null) {
    return cache.value
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    cache.value = raw === null ? EMPTY : (JSON.parse(raw) as QueuedOrder[])
  } catch {
    cache.value = EMPTY
  }
  return cache.value
}

function write(queue: readonly QueuedOrder[]): void {
  cache.value = queue
  try {
    if (queue.length === 0) {
      localStorage.removeItem(STORAGE_KEY)
    } else {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(queue))
    }
  } catch {
    // Sin almacenamiento la cola dura lo que la pestaña: es lo mejor posible.
  }
  for (const listener of listeners) {
    listener()
  }
}

export function queuedOrders(): readonly QueuedOrder[] {
  return read()
}

export function enqueueOrder(order: QueuedOrder): void {
  write([...read(), order])
}

export function removeQueued(clientRequestId: string): void {
  write(read().filter((order) => order.request.client_request_id !== clientRequestId))
}

export function subscribeQueue(listener: Listener): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
