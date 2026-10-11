import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals'
import { renderHook } from '@testing-library/react'

import type { ShellScreen } from './shellScreens'
import { useOfflineWarmup } from './useOfflineWarmup'

const load = jest.fn<() => Promise<unknown>>(() => Promise.resolve({}))
const loadOther = jest.fn<() => Promise<unknown>>(() => Promise.resolve({}))
const loadRestricted = jest.fn<() => Promise<unknown>>(() => Promise.resolve({}))

const TAKE_ORDERS = 'orders.take'

const SCREENS: readonly ShellScreen[] = [
  { path: '/pedidos', permission: TAKE_ORDERS, offline: true, load },
  { path: '/caja', permission: 'cash.manage', load: loadOther },
  { path: '/pedidos/nuevo', permission: 'orders.manage', offline: true, load: loadRestricted },
]

beforeEach(() => {
  jest.useFakeTimers()
  Object.defineProperty(navigator, 'serviceWorker', { configurable: true, value: { ready: Promise.resolve({}) } })
})

afterEach(() => {
  jest.useRealTimers()
  Reflect.deleteProperty(navigator, 'serviceWorker')
})

describe('useOfflineWarmup', () => {
  it('con el service worker listo baja solo las pantallas sin señal que la cuenta puede abrir', async () => {
    renderHook(() => {
      useOfflineWarmup(SCREENS, [TAKE_ORDERS])
    })

    await jest.advanceTimersByTimeAsync(3100)

    expect(load).toHaveBeenCalledTimes(1)
    expect(loadOther).not.toHaveBeenCalled()
    expect(loadRestricted).not.toHaveBeenCalled()
  })

  it('no baja nada si se cierra antes de tiempo', async () => {
    const { unmount } = renderHook(() => {
      useOfflineWarmup(SCREENS, [TAKE_ORDERS])
    })
    await jest.advanceTimersByTimeAsync(10)
    unmount()

    await jest.advanceTimersByTimeAsync(5000)

    expect(load).not.toHaveBeenCalled()
  })

  it('sin service worker no hace nada', async () => {
    Reflect.deleteProperty(navigator, 'serviceWorker')
    renderHook(() => {
      useOfflineWarmup(SCREENS, [TAKE_ORDERS])
    })

    await jest.advanceTimersByTimeAsync(5000)

    expect(load).not.toHaveBeenCalled()
  })
})
