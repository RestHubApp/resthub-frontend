/**
 * @jest-environment ./jest/nodeEnvironment.cjs
 */
// Simula una pestaña sin DOM (location, window y almacenamiento de prueba),
// como corría con Vitest: en jsdom, `window.location` no se puede reemplazar.
import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { stubGlobal, unstubAllGlobals } from '#jest/globals'

import type { OpenOrderRequest } from '@/api/types'
import type { QueuedOrder } from './offlineQueue'

const V1 = 'resthub.pedidos-sin-enviar.v1'
const V2 = 'resthub.pedidos-sin-enviar.v2'

const waiter = { userId: 7, restaurantId: 1 }
const otherWaiter = { userId: 8, restaurantId: 1 }
// El mismo id de usuario puede existir en otro local.
const otherRestaurant = { userId: 7, restaurantId: 2 }

function order(id: string, owner: { userId: number; restaurantId: number }): QueuedOrder {
  return {
    ...owner,
    request: { client_request_id: id } as OpenOrderRequest,
    queuedAt: '2026-09-25T20:00:00Z',
    label: `Mesa ${id}`,
  }
}

function fakeStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial))
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => {
      data.set(key, value)
    },
    removeItem: (key: string) => {
      data.delete(key)
    },
    data,
  }
}

// La cola guarda su lectura en memoria: cada prueba parte de un módulo nuevo.
async function queue(initial: Record<string, string> = {}) {
  const storage = fakeStorage(initial)
  stubGlobal('localStorage', storage)
  jest.resetModules()
  return { ...(await import('./offlineQueue')), storage }
}

// Una pestaña de vista previa: ya abrió su sesión y quedó marcada.
async function previewQueue() {
  const local = fakeStorage()
  const tab = fakeStorage({ 'resthub.vista-previa.pestana.v1': '1' })
  stubGlobal('localStorage', local)
  stubGlobal('sessionStorage', tab)
  jest.resetModules()
  return { ...(await import('./offlineQueue')), local, tab }
}

beforeEach(() => {
  unstubAllGlobals()
})

describe('queuedOrders', () => {
  it('lista solo los pedidos de la cuenta activa, en su local', async () => {
    const { enqueueOrder, queuedOrders } = await queue()
    enqueueOrder(order('a', waiter))
    enqueueOrder(order('b', otherWaiter))
    enqueueOrder(order('c', otherRestaurant))

    expect(queuedOrders(waiter).map((p) => p.label)).toEqual(['Mesa a'])
    expect(queuedOrders(otherWaiter).map((p) => p.label)).toEqual(['Mesa b'])
    expect(queuedOrders(otherRestaurant).map((p) => p.label)).toEqual(['Mesa c'])
  })

  it('sin sesión no hay pedidos que mostrar ni enviar', async () => {
    const { enqueueOrder, queuedOrders } = await queue()
    enqueueOrder(order('a', waiter))
    expect(queuedOrders(null)).toEqual([])
  })

  it('devuelve la misma lista mientras la cola no cambie', async () => {
    const { enqueueOrder, queuedOrders } = await queue()
    enqueueOrder(order('a', waiter))
    const first = queuedOrders(waiter)
    expect(queuedOrders(waiter)).toBe(first)
    enqueueOrder(order('b', waiter))
    expect(queuedOrders(waiter)).not.toBe(first)
  })

  it('quitar un pedido enviado no toca los de otras cuentas', async () => {
    const { enqueueOrder, queuedOrders, removeQueued } = await queue()
    enqueueOrder(order('a', waiter))
    enqueueOrder(order('b', otherWaiter))
    removeQueued('a')
    expect(queuedOrders(waiter)).toEqual([])
    expect(queuedOrders(otherWaiter)).toHaveLength(1)
  })

  it('ignora lo guardado sin dueño, sea de la v1 o de la clave nueva', async () => {
    const withoutOwner = JSON.stringify([{ request: { client_request_id: 'x' }, queuedAt: '', label: 'Mesa x' }])
    const { queuedOrders } = await queue({ [V1]: withoutOwner, [V2]: withoutOwner })
    expect(queuedOrders(waiter)).toEqual([])
  })

  it('guarda en la clave v2 y la lee de nuevo al reabrir la app', async () => {
    const first = await queue()
    first.enqueueOrder(order('a', waiter))
    const saved = first.storage.data.get(V2) ?? ''

    const { queuedOrders } = await queue({ [V2]: saved })
    expect(queuedOrders(waiter).map((p) => p.label)).toEqual(['Mesa a'])
  })
})

describe('varias pestañas', () => {
  it('encolar no borra lo que encoló otra pestaña', async () => {
    const { enqueueOrder, queuedOrders, storage } = await queue()
    enqueueOrder(order('a', waiter))
    // La otra pestaña leyó la cola antes y le sumó su pedido.
    storage.data.set(V2, JSON.stringify([order('a', waiter), order('b', waiter)]))

    enqueueOrder(order('c', waiter))

    expect(queuedOrders(waiter).map((p) => p.label)).toEqual(['Mesa a', 'Mesa b', 'Mesa c'])
  })

  it('un cambio en otra pestaña se ve sin recargar', async () => {
    const window = new EventTarget()
    stubGlobal('window', window)
    const { enqueueOrder, queuedOrders, subscribeQueue, storage } = await queue()
    enqueueOrder(order('a', waiter))
    const notice = jest.fn()
    subscribeQueue(notice)

    storage.data.set(V2, JSON.stringify([order('a', waiter), order('b', waiter)]))
    window.dispatchEvent(Object.assign(new Event('storage'), { key: V2, storageArea: storage }))

    expect(notice).toHaveBeenCalled()
    expect(queuedOrders(waiter).map((p) => p.label)).toEqual(['Mesa a', 'Mesa b'])
  })
})

describe('en una vista previa', () => {
  it('la cola vive en el sessionStorage de la pestaña y no toca localStorage', async () => {
    const { enqueueOrder, queuedOrders, local, tab } = await previewQueue()
    local.data.set(V2, JSON.stringify([order('real', waiter)]))

    enqueueOrder(order('muestra', waiter))

    expect(queuedOrders(waiter).map((p) => p.label)).toEqual(['Mesa muestra'])
    expect(JSON.parse(local.data.get(V2) ?? '[]')).toEqual([order('real', waiter)])
    expect(JSON.parse(tab.data.get(V2) ?? '[]')).toEqual([order('muestra', waiter)])
  })

  it('un cambio en la cola real de otra pestaña no le llega', async () => {
    const window = new EventTarget()
    stubGlobal('window', window)
    const { subscribeQueue, local } = await previewQueue()
    const notice = jest.fn()
    subscribeQueue(notice)

    window.dispatchEvent(Object.assign(new Event('storage'), { key: V2, storageArea: local }))

    expect(notice).not.toHaveBeenCalled()
  })
})

describe('discardPreviewQueue', () => {
  it('en una vista previa vacía la cola entera de la pestaña, de cualquier cuenta', async () => {
    const { enqueueOrder, discardPreviewQueue, queuedOrders, local, tab } = await previewQueue()
    local.data.set(V2, JSON.stringify([order('real', waiter)]))
    enqueueOrder(order('a', waiter))
    enqueueOrder(order('b', otherWaiter))

    discardPreviewQueue()

    expect(queuedOrders(waiter)).toEqual([])
    expect(queuedOrders(otherWaiter)).toEqual([])
    expect(tab.data.has(V2)).toBe(false)
    expect(JSON.parse(local.data.get(V2) ?? '[]')).toEqual([order('real', waiter)])
  })

  it('en una pestaña normal no toca la cola del navegador', async () => {
    const { enqueueOrder, discardPreviewQueue, queuedOrders } = await queue()
    enqueueOrder(order('a', waiter))

    discardPreviewQueue()

    expect(queuedOrders(waiter).map((p) => p.label)).toEqual(['Mesa a'])
  })
})

describe('ownerOf', () => {
  it('toma la persona y el local de la sesión', async () => {
    const { ownerOf } = await queue()
    const account = { user: { id: 7 }, restaurant: { id: 1 } } as Parameters<typeof ownerOf>[0]
    expect(ownerOf(account)).toEqual(waiter)
    expect(ownerOf(null)).toBeNull()
  })
})
