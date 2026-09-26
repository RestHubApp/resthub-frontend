import { useSyncExternalStore } from 'react'

import type { CurrentUserResponse, OpenOrderRequest } from '../api/types'

// Los pedidos que el mesero tomó sin señal, a la espera de enviarse.
//
// Viven en `localStorage` para sobrevivir a cerrar la app o que el celular se
// apague. Cada uno lleva el `client_request_id` con que se va a abrir: si el
// envío llegó al servidor pero la respuesta se perdió, el reintento devuelve
// el mismo pedido en vez de duplicarlo.
//
// Cada pedido es de la cuenta que lo tomó. En un celular compartido la cola
// guarda los de varias cuentas, pero cada una ve y envía solo los suyos: el
// envío sale con el token activo y no puede abrir un pedido a nombre de otro
// mesero ni en otro local. Cerrar la sesión no los borra; vuelven a aparecer
// cuando esa misma cuenta entra otra vez.
//
// La versión va en la clave: la v1 no decía de quién era cada pedido y no se lee.
const STORAGE_KEY = 'resthub.pedidos-sin-enviar.v2'

/** La cuenta dueña de un pedido en cola: la persona y el local donde lo tomó. */
export interface QueueOwner {
  readonly userId: number
  readonly restaurantId: number
}

export interface QueuedOrder extends QueueOwner {
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
// `useSyncExternalStore` necesita la misma lista mientras la cola no cambie.
const vista: { base: readonly QueuedOrder[] | null; owner: string; value: readonly QueuedOrder[] } = {
  base: null,
  owner: '',
  value: EMPTY,
}

/** La dueña de lo que se toma con esta sesión, o `null` sin sesión. */
export function ownerOf(account: CurrentUserResponse | null): QueueOwner | null {
  return account === null ? null : { userId: account.user.id, restaurantId: account.restaurant.id }
}

export function belongsTo(order: QueuedOrder, owner: QueueOwner | null): boolean {
  return owner !== null && order.userId === owner.userId && order.restaurantId === owner.restaurantId
}

function read(): readonly QueuedOrder[] {
  if (cache.value !== null) {
    return cache.value
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed: unknown = raw === null ? null : JSON.parse(raw)
    cache.value = Array.isArray(parsed) ? (parsed as QueuedOrder[]) : EMPTY
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

/** Los pedidos en cola de esa cuenta; los de otras cuentas no se listan ni se envían. */
export function queuedOrders(owner: QueueOwner | null): readonly QueuedOrder[] {
  if (owner === null) {
    return EMPTY
  }
  const base = read()
  const clave = `${String(owner.userId)}:${String(owner.restaurantId)}`
  if (vista.base !== base || vista.owner !== clave) {
    vista.base = base
    vista.owner = clave
    vista.value = base.filter((order) => belongsTo(order, owner))
  }
  return vista.value
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

/** Los pedidos en cola de la cuenta, al día con cada cambio de la cola. */
export function useQueuedOrders(account: CurrentUserResponse | null): readonly QueuedOrder[] {
  const owner = ownerOf(account)
  return useSyncExternalStore(subscribeQueue, () => queuedOrders(owner))
}
