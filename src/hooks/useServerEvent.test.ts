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

describe('useServerEvent', () => {
  it('abre el canal con el token en la cabecera, nunca en la URL', async () => {
    const channel = noticesChannel()
    setAuthToken('token-secreto')
    listen(ORDERS)

    await waitFor(() => {
      expect(channel.connections).toHaveLength(1)
    })
    expect(channel.connections[0]).toEqual({ url: '/api/v1/events', authorization: 'Bearer token-secreto' })
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
    listen(ORDERS)
    setAuthToken('t')
    listen(ORDERS, false)
    expect(channel.connections).toHaveLength(0)
  })

  it('si el canal se corta, reintenta a los tres segundos', async () => {
    jest.useFakeTimers()
    const channel = noticesChannel()
    setAuthToken('t')
    listen(ORDERS)
    await jest.advanceTimersByTimeAsync(0)
    expect(channel.connections).toHaveLength(1)

    channel.cut()
    await jest.advanceTimersByTimeAsync(2999)
    expect(channel.connections).toHaveLength(1)
    await jest.advanceTimersByTimeAsync(1)
    expect(channel.connections).toHaveLength(2)
  })

  it('con 401 no reintenta: la credencial no va a mejorar sola', async () => {
    jest.useFakeTimers()
    const channel = noticesChannel()
    channel.respondWith(401)
    setAuthToken('vencido')
    listen(ORDERS)

    await jest.advanceTimersByTimeAsync(10_000)
    expect(channel.connections).toHaveLength(1)
  })

  it('al desmontarse cierra la conexión y no reintenta', async () => {
    jest.useFakeTimers()
    const channel = noticesChannel()
    setAuthToken('t')
    const { unmount } = listen(ORDERS)
    await jest.advanceTimersByTimeAsync(0)

    unmount()
    await jest.advanceTimersByTimeAsync(10_000)
    expect(channel.connections).toHaveLength(1)
  })
})
