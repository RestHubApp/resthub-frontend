import { afterEach, describe, expect, it } from '@jest/globals'
import { act, renderHook } from '@testing-library/react'

import { handleAccount, PERMISSIONS_WAITER } from '#jest/harness'
import { enqueueOrder, queuedOrders, removeQueued, subscribeQueue, useQueuedOrders, type QueuedOrder } from './offlineQueue'

const ANA = handleAccount(PERMISSIONS_WAITER)
const LUIS = handleAccount(PERMISSIONS_WAITER, { user: { ...ANA.user, id: 8, full_name: 'Luis' } })

function order(id: string, userId = ANA.user.id): QueuedOrder {
  return {
    userId,
    restaurantId: ANA.restaurant.id,
    request: { client_request_id: id, type: 'dine_in', table_id: 3, items: [] } as unknown as QueuedOrder['request'],
    queuedAt: '2026-09-26T20:00:00Z',
    label: 'Mesa 3',
  }
}

afterEach(() => {
  for (const orderValue of queuedOrders({ userId: ANA.user.id, restaurantId: 1 })) {
    removeQueued(orderValue.request.client_request_id ?? '')
  }
  for (const orderValue of queuedOrders({ userId: LUIS.user.id, restaurantId: 1 })) {
    removeQueued(orderValue.request.client_request_id ?? '')
  }
})

describe('useQueuedOrders', () => {
  it('muestra la cola de la cuenta y se actualiza con cada cambio', () => {
    const { result } = renderHook(() => useQueuedOrders(ANA))
    expect(result.current).toEqual([])

    act(() => {
      enqueueOrder(order('a'))
    })
    expect(result.current.map((o) => o.request.client_request_id)).toEqual(['a'])

    act(() => {
      removeQueued('a')
    })
    expect(result.current).toEqual([])
  })

  it('no mezcla la cola de otra cuenta en el mismo celular, y sin sesión no hay cola', () => {
    act(() => {
      enqueueOrder(order('de-luis', LUIS.user.id))
    })
    expect(renderHook(() => useQueuedOrders(ANA)).result.current).toEqual([])
    expect(renderHook(() => useQueuedOrders(LUIS)).result.current).toHaveLength(1)
    expect(renderHook(() => useQueuedOrders(null)).result.current).toEqual([])
  })

  it('quien deja de escuchar ya no recibe avisos', () => {
    let notices = 0
    const leave = subscribeQueue(() => {
      notices += 1
    })
    enqueueOrder(order('b'))
    leave()
    enqueueOrder(order('c'))
    expect(notices).toBe(1)
  })
})
