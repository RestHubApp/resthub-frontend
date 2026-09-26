import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { OpenOrderRequest } from '../api/types'
import type { QueuedOrder } from './offlineQueue'

const V1 = 'resthub.pedidos-sin-enviar.v1'
const V2 = 'resthub.pedidos-sin-enviar.v2'

const mesero = { userId: 7, restaurantId: 1 }
const otroMesero = { userId: 8, restaurantId: 1 }
// El mismo id de usuario puede existir en otro local.
const otroLocal = { userId: 7, restaurantId: 2 }

function pedido(id: string, owner: { userId: number; restaurantId: number }): QueuedOrder {
  return {
    ...owner,
    request: { client_request_id: id } as OpenOrderRequest,
    queuedAt: '2026-09-25T20:00:00Z',
    label: `Mesa ${id}`,
  }
}

function fakeStorage(inicial: Record<string, string> = {}) {
  const datos = new Map(Object.entries(inicial))
  return {
    getItem: (clave: string) => datos.get(clave) ?? null,
    setItem: (clave: string, valor: string) => {
      datos.set(clave, valor)
    },
    removeItem: (clave: string) => {
      datos.delete(clave)
    },
    datos,
  }
}

// La cola guarda su lectura en memoria: cada prueba parte de un módulo nuevo.
async function cola(inicial: Record<string, string> = {}) {
  const storage = fakeStorage(inicial)
  vi.stubGlobal('localStorage', storage)
  vi.resetModules()
  return { ...(await import('./offlineQueue')), storage }
}

// Una pestaña de vista previa: ya abrió su sesión y quedó marcada.
async function colaDeVistaPrevia() {
  const local = fakeStorage()
  const pestana = fakeStorage({ 'resthub.vista-previa.pestana.v1': '1' })
  vi.stubGlobal('localStorage', local)
  vi.stubGlobal('sessionStorage', pestana)
  vi.resetModules()
  return { ...(await import('./offlineQueue')), local, pestana }
}

beforeEach(() => {
  vi.unstubAllGlobals()
})

describe('queuedOrders', () => {
  it('lista solo los pedidos de la cuenta activa, en su local', async () => {
    const { enqueueOrder, queuedOrders } = await cola()
    enqueueOrder(pedido('a', mesero))
    enqueueOrder(pedido('b', otroMesero))
    enqueueOrder(pedido('c', otroLocal))

    expect(queuedOrders(mesero).map((p) => p.label)).toEqual(['Mesa a'])
    expect(queuedOrders(otroMesero).map((p) => p.label)).toEqual(['Mesa b'])
    expect(queuedOrders(otroLocal).map((p) => p.label)).toEqual(['Mesa c'])
  })

  it('sin sesión no hay pedidos que mostrar ni enviar', async () => {
    const { enqueueOrder, queuedOrders } = await cola()
    enqueueOrder(pedido('a', mesero))
    expect(queuedOrders(null)).toEqual([])
  })

  it('devuelve la misma lista mientras la cola no cambie', async () => {
    const { enqueueOrder, queuedOrders } = await cola()
    enqueueOrder(pedido('a', mesero))
    const primera = queuedOrders(mesero)
    expect(queuedOrders(mesero)).toBe(primera)
    enqueueOrder(pedido('b', mesero))
    expect(queuedOrders(mesero)).not.toBe(primera)
  })

  it('quitar un pedido enviado no toca los de otras cuentas', async () => {
    const { enqueueOrder, queuedOrders, removeQueued } = await cola()
    enqueueOrder(pedido('a', mesero))
    enqueueOrder(pedido('b', otroMesero))
    removeQueued('a')
    expect(queuedOrders(mesero)).toEqual([])
    expect(queuedOrders(otroMesero)).toHaveLength(1)
  })

  it('ignora lo guardado sin dueño, sea de la v1 o de la clave nueva', async () => {
    const sinDueno = JSON.stringify([{ request: { client_request_id: 'x' }, queuedAt: '', label: 'Mesa x' }])
    const { queuedOrders } = await cola({ [V1]: sinDueno, [V2]: sinDueno })
    expect(queuedOrders(mesero)).toEqual([])
  })

  it('guarda en la clave v2 y la lee de nuevo al reabrir la app', async () => {
    const primera = await cola()
    primera.enqueueOrder(pedido('a', mesero))
    const guardado = primera.storage.datos.get(V2) ?? ''

    const { queuedOrders } = await cola({ [V2]: guardado })
    expect(queuedOrders(mesero).map((p) => p.label)).toEqual(['Mesa a'])
  })
})

describe('varias pestañas', () => {
  it('encolar no borra lo que encoló otra pestaña', async () => {
    const { enqueueOrder, queuedOrders, storage } = await cola()
    enqueueOrder(pedido('a', mesero))
    // La otra pestaña leyó la cola antes y le sumó su pedido.
    storage.datos.set(V2, JSON.stringify([pedido('a', mesero), pedido('b', mesero)]))

    enqueueOrder(pedido('c', mesero))

    expect(queuedOrders(mesero).map((p) => p.label)).toEqual(['Mesa a', 'Mesa b', 'Mesa c'])
  })

  it('un cambio en otra pestaña se ve sin recargar', async () => {
    const ventana = new EventTarget()
    vi.stubGlobal('window', ventana)
    const { enqueueOrder, queuedOrders, subscribeQueue, storage } = await cola()
    enqueueOrder(pedido('a', mesero))
    const aviso = vi.fn()
    subscribeQueue(aviso)

    storage.datos.set(V2, JSON.stringify([pedido('a', mesero), pedido('b', mesero)]))
    ventana.dispatchEvent(Object.assign(new Event('storage'), { key: V2, storageArea: storage }))

    expect(aviso).toHaveBeenCalled()
    expect(queuedOrders(mesero).map((p) => p.label)).toEqual(['Mesa a', 'Mesa b'])
  })
})

describe('en una vista previa', () => {
  it('la cola vive en el sessionStorage de la pestaña y no toca localStorage', async () => {
    const { enqueueOrder, queuedOrders, local, pestana } = await colaDeVistaPrevia()
    local.datos.set(V2, JSON.stringify([pedido('real', mesero)]))

    enqueueOrder(pedido('muestra', mesero))

    expect(queuedOrders(mesero).map((p) => p.label)).toEqual(['Mesa muestra'])
    expect(JSON.parse(local.datos.get(V2) ?? '[]')).toEqual([pedido('real', mesero)])
    expect(JSON.parse(pestana.datos.get(V2) ?? '[]')).toEqual([pedido('muestra', mesero)])
  })

  it('un cambio en la cola real de otra pestaña no le llega', async () => {
    const ventana = new EventTarget()
    vi.stubGlobal('window', ventana)
    const { subscribeQueue, local } = await colaDeVistaPrevia()
    const aviso = vi.fn()
    subscribeQueue(aviso)

    ventana.dispatchEvent(Object.assign(new Event('storage'), { key: V2, storageArea: local }))

    expect(aviso).not.toHaveBeenCalled()
  })
})

describe('discardPreviewQueue', () => {
  it('en una vista previa vacía la cola entera de la pestaña, de cualquier cuenta', async () => {
    const { enqueueOrder, discardPreviewQueue, queuedOrders, local, pestana } = await colaDeVistaPrevia()
    local.datos.set(V2, JSON.stringify([pedido('real', mesero)]))
    enqueueOrder(pedido('a', mesero))
    enqueueOrder(pedido('b', otroMesero))

    discardPreviewQueue()

    expect(queuedOrders(mesero)).toEqual([])
    expect(queuedOrders(otroMesero)).toEqual([])
    expect(pestana.datos.has(V2)).toBe(false)
    expect(JSON.parse(local.datos.get(V2) ?? '[]')).toEqual([pedido('real', mesero)])
  })

  it('en una pestaña normal no toca la cola del navegador', async () => {
    const { enqueueOrder, discardPreviewQueue, queuedOrders } = await cola()
    enqueueOrder(pedido('a', mesero))

    discardPreviewQueue()

    expect(queuedOrders(mesero).map((p) => p.label)).toEqual(['Mesa a'])
  })
})

describe('ownerOf', () => {
  it('toma la persona y el local de la sesión', async () => {
    const { ownerOf } = await cola()
    const account = { user: { id: 7 }, restaurant: { id: 1 } } as Parameters<typeof ownerOf>[0]
    expect(ownerOf(account)).toEqual(mesero)
    expect(ownerOf(null)).toBeNull()
  })
})
