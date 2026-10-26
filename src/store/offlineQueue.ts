import { useSyncExternalStore } from 'react'

import type { StaffSession, OpenOrderRequest } from '@/api/types'
import { tabStorage } from '@/services/tabStorage'

// Los pedidos que el mesero tomó sin señal, a la espera de enviarse.
//
// Viven en `localStorage` para sobrevivir a cerrar la app o que el celular se
// apague. En una pestaña de vista previa viven en su `sessionStorage`, como su
// sesión: lo que se encola en el local de muestra muere con la pestaña y nunca
// se mezcla con la cola real del navegador. Cada uno lleva el `client_request_id` con que se va a abrir: si el
// envío llegó al servidor pero la respuesta se perdió, el reintento devuelve
// el mismo pedido en vez de duplicarlo.
//
// Cada pedido es de la cuenta que lo tomó. En un celular compartido la cola
// guarda los de varias cuentas, pero cada una ve y envía solo los suyos: el
// envío sale con el token activo y no puede abrir un pedido a nombre de otro
// mesero ni en otro local. Cerrar la sesión borra los que guardan datos del
// cliente (nombre, teléfono, dirección: un delivery o un pedido para llevar), para
// que no queden en el celular sin nadie dentro (ASVS V14.3.1); los demás vuelven a
// aparecer cuando esa misma cuenta entra otra vez. Si la sesión vence sola, quedan
// todos: la cuenta los envía al volver a entrar.
//
// La versión va en la clave: la v1 no decía de quién era cada pedido y no se lee.
const STORAGE_KEY = 'resthub.pedidos-sin-enviar.v2'
const STORAGE = tabStorage.storage

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
const view: { base: readonly QueuedOrder[] | null; owner: string; value: readonly QueuedOrder[] } = {
  base: null,
  owner: '',
  value: EMPTY,
}

/** La dueña de lo que se toma con esta sesión, o `null` sin sesión. */
export function ownerOf(account: StaffSession | null): QueueOwner | null {
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
    const raw = STORAGE?.getItem(STORAGE_KEY) ?? null
    const parsed: unknown = raw === null ? null : JSON.parse(raw)
    cache.value = Array.isArray(parsed) ? (parsed as QueuedOrder[]) : EMPTY
  } catch {
    cache.value = EMPTY
  }
  return cache.value
}

// Lo que está guardado ahora, no lo que leyó esta pestaña: la PWA y una
// pestaña del navegador comparten la cola, y escribir sobre una copia vieja
// borraría en silencio lo que encoló la otra.
function fresh(): readonly QueuedOrder[] {
  cache.value = null
  return read()
}

function notify(): void {
  for (const listener of listeners) {
    listener()
  }
}

function write(queue: readonly QueuedOrder[]): void {
  cache.value = queue
  try {
    if (queue.length === 0) {
      STORAGE?.removeItem(STORAGE_KEY)
    } else {
      STORAGE?.setItem(STORAGE_KEY, JSON.stringify(queue))
    }
  } catch {
    // Sin almacenamiento la cola dura lo que la pestaña: es lo mejor posible.
  }
  notify()
}

// Otra pestaña cambió la cola (o se vació el almacenamiento): se vuelve a
// leer y se avisa a las pantallas. Un cambio en el otro almacenamiento (la
// cola real, vista desde una vista previa) no es de esta cola.
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event: StorageEvent) => {
    if (event.storageArea !== null && event.storageArea !== STORAGE) {
      return
    }
    if (event.key === STORAGE_KEY || event.key === null) {
      cache.value = null
      notify()
    }
  })
}

/** Los pedidos en cola de esa cuenta; los de otras cuentas no se listan ni se envían. */
export function queuedOrders(owner: QueueOwner | null): readonly QueuedOrder[] {
  if (owner === null) {
    return EMPTY
  }
  const base = read()
  const password = `${String(owner.userId)}:${String(owner.restaurantId)}`
  if (view.base !== base || view.owner !== password) {
    view.base = base
    view.owner = password
    view.value = base.filter((order) => belongsTo(order, owner))
  }
  return view.value
}

/** Si el pedido guarda datos del cliente: su nombre, su teléfono o una dirección de entrega. */
export function hasCustomerData(order: QueuedOrder): boolean {
  const { customer_name, customer_phone, delivery_address, delivery_reference } = order.request
  return [customer_name, customer_phone, delivery_address, delivery_reference].join('').trim() !== ''
}

/** Al cerrar la sesión: borra los pedidos de esa cuenta que guardan datos del cliente. */
export function discardCustomerDataOf(owner: QueueOwner | null): void {
  const queue = fresh()
  const kept = queue.filter((order) => !(belongsTo(order, owner) && hasCustomerData(order)))
  if (kept.length !== queue.length) {
    write(kept)
  }
}

export function enqueueOrder(order: QueuedOrder): void {
  write([...fresh(), order])
}

export function removeQueued(clientRequestId: string): void {
  write(fresh().filter((order) => order.request.client_request_id !== clientRequestId))
}

/**
 * Vacía la cola entera de una pestaña de vista previa: al salir de ella o al
 * vencer su sesión.
 *
 * Esa cola vive en el `sessionStorage` de la pestaña y es solo suya: cuanto
 * tiene es del local de muestra, y sin sesión ya no hay con qué enviarlo.
 * En una pestaña normal no hace nada: la cola del navegador guarda pedidos de
 * verdad, de varias cuentas.
 */
export function discardPreviewQueue(): void {
  if (tabStorage.kind !== 'preview') {
    return
  }
  write(EMPTY)
}

export function subscribeQueue(listener: Listener): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

/** Los pedidos en cola de la cuenta, al día con cada cambio de la cola. */
export function useQueuedOrders(account: StaffSession | null): readonly QueuedOrder[] {
  const owner = ownerOf(account)
  const snapshot = () => queuedOrders(owner)
  // La misma lectura sirve al generar la pantalla fuera del navegador (las pruebas).
  return useSyncExternalStore(subscribeQueue, snapshot, snapshot)
}
