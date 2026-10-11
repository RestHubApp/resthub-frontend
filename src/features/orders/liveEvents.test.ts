import { describe, expect, it, jest } from '@jest/globals'
import { QueryClient } from '@tanstack/react-query'

import { ordersQueryKey } from '@/api/orders'
import { menuQueryKey } from '@/api/menu'
import { createLiveEventHandler } from './liveEvents'

describe('createLiveEventHandler', () => {
  it('un aviso de pedidos invalida solo las consultas de su tema', () => {
    const queryClient = new QueryClient()
    const invalidate = jest.spyOn(queryClient, 'invalidateQueries')
    const handle = createLiveEventHandler(queryClient, jest.fn())

    handle({ type: 'orders' })

    expect(invalidate).toHaveBeenCalledWith({ queryKey: ordersQueryKey })
    expect(invalidate).not.toHaveBeenCalledWith({ queryKey: menuQueryKey })
  })

  it('un tema desconocido no invalida nada', () => {
    const queryClient = new QueryClient()
    const invalidate = jest.spyOn(queryClient, 'invalidateQueries')

    createLiveEventHandler(queryClient, jest.fn())({ type: 'otro' })

    expect(invalidate).not.toHaveBeenCalled()
  })

  it('el primer ready solo marca el canal activo; los siguientes, al reconectar, piden todo de nuevo', () => {
    const queryClient = new QueryClient()
    const invalidate = jest.spyOn(queryClient, 'invalidateQueries')
    const onReady = jest.fn()
    const handle = createLiveEventHandler(queryClient, onReady)

    handle({ type: 'ready' })
    expect(onReady).toHaveBeenCalledTimes(1)
    expect(invalidate).not.toHaveBeenCalled()

    handle({ type: 'ready' })
    expect(onReady).toHaveBeenCalledTimes(2)
    expect(invalidate).toHaveBeenCalledWith({ queryKey: menuQueryKey })
  })
})
