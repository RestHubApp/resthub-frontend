import { afterEach, describe, expect, it, jest } from '@jest/globals'
import { renderHook, waitFor } from '@testing-library/react'

import { noticesChannel } from '#jest/channel'
import { setAuthToken } from '@/services/apiCredentials'
import { useServerEvent } from './useServerEvent'

const ORDERS = 'orders'

function listen(topic: string, enabled = true) {
  const received: string[] = []
  const view = renderHook(() => {
    useServerEvent(topic, (data) => received.push(data), enabled)
  })
  return { received, ...view }
}

afterEach(() => {
  jest.useRealTimers()
})

// Adelanta el reloj falso y deja correr la red: MSW 3 responde en el socket de
// Node a lo largo de varias vueltas de `setImmediate` (que no se falsea).
// Los tipos del navegador no declaran `setImmediate`; el entorno lo toma de Node.
const { setImmediate: nextTurn } = globalThis as unknown as { setImmediate: (callback: () => void) => void }

async function advance(ms: number) {
  await jest.advanceTimersByTimeAsync(ms)
  for (let turn = 0; turn < 20; turn += 1) {
    await new Promise<void>((resolve) => {
      nextTurn(resolve)
    })
  }
}

describe('useServerEvent', () => {
  it('abre el canal con el token en la cabecera, nunca en la URL', async () => {
    const channel = noticesChannel()
    setAuthToken('token-secreto')
    listen(ORDERS)

    await waitFor(() => {
      expect(channel.connections).toHaveLength(1)
    })
    expect(channel.connections[0]).toEqual({ url: 'http://localhost/api/v1/events', authorization: 'Bearer token-secreto' })
  })

  it('entrega solo los avisos de su tema', async () => {
    const channel = noticesChannel()
    setAuthToken('t')
    const { received } = listen(ORDERS)
    await waitFor(() => {
      expect(channel.connections).toHaveLength(1)
    })

    channel.issue('cash', '{"id":1}')
    channel.issue(ORDERS, '{"id":2}')

    await waitFor(() => {
      expect(received).toEqual(['{"id":2}'])
    })
  })

  it('sin sesión o desactivado no abre ninguna conexión', () => {
    const channel = noticesChannel()
    setAuthToken(null)
    listen(ORDERS).unmount()
    setAuthToken('t')
    listen(ORDERS, false)
    expect(channel.connections).toHaveLength(0)
  })

  it('si el canal se corta, reintenta a los tres segundos', async () => {
    jest.useFakeTimers({ doNotFake: ['setImmediate', 'nextTick', 'queueMicrotask'] })
    const channel = noticesChannel()
    setAuthToken('t')
    listen(ORDERS)
    await advance(0)
    expect(channel.connections).toHaveLength(1)

    channel.cut()
    await advance(2999)
    expect(channel.connections).toHaveLength(1)
    await advance(1)
    expect(channel.connections).toHaveLength(2)
  })

  it('con 401 no reintenta: la credencial no va a mejorar sola', async () => {
    jest.useFakeTimers({ doNotFake: ['setImmediate', 'nextTick', 'queueMicrotask'] })
    const channel = noticesChannel()
    channel.respondWith(401, 'unauthenticated')
    setAuthToken('vencido')
    listen(ORDERS)

    await advance(10_000)
    expect(channel.connections).toHaveLength(1)
  })

  it('con `forbidden` tampoco reintenta, pero un error sin código de acceso sí', async () => {
    jest.useFakeTimers({ doNotFake: ['setImmediate', 'nextTick', 'queueMicrotask'] })
    const channel = noticesChannel()
    channel.respondWith(403, 'forbidden')
    setAuthToken('t')
    listen(ORDERS)
    await advance(10_000)
    expect(channel.connections).toHaveLength(1)

    channel.respondWith(503, 'database_unavailable')
    await advance(0)
    listen(ORDERS)
    // Primero llega el 503 y programa el reintento; recién entonces corre el reloj.
    await advance(0)
    expect(channel.connections).toHaveLength(2)
    await advance(3000)
    expect(channel.connections.length).toBeGreaterThan(2)
  })

  it('al desmontarse cierra la conexión y no reintenta', async () => {
    jest.useFakeTimers({ doNotFake: ['setImmediate', 'nextTick', 'queueMicrotask'] })
    const channel = noticesChannel()
    setAuthToken('t')
    const { unmount } = listen(ORDERS)
    await advance(0)

    unmount()
    await advance(10_000)
    expect(channel.connections).toHaveLength(1)
  })
})

describe('useServerEvent tras recargar', () => {
  it('se abre cuando llega el token: tras recargar, al recuperarlo de la cookie', async () => {
    const channel = noticesChannel()
    setAuthToken(null)
    listen(ORDERS)
    expect(channel.connections).toHaveLength(0)

    setAuthToken('token-recuperado')

    await waitFor(() => {
      expect(channel.connections).toEqual([{ url: 'http://localhost/api/v1/events', authorization: 'Bearer token-recuperado' }])
    })
  })
})
