import { afterEach, describe, expect, it, jest } from '@jest/globals'
import { renderHook, waitFor } from '@testing-library/react'

import { noticesChannel } from '#jest/canal'
import { setAuthToken } from '@/services/api'
import { useServerEvent } from './useServerEvent'

const ORDERS = 'orders'

function listen(topic: string, enabled = true) {
  const received: string[] = []
  const vista = renderHook(() => {
    useServerEvent(topic, (data) => received.push(data), enabled)
  })
  return { recibidos: received, ...vista }
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
      expect(channel.conexiones).toHaveLength(1)
    })
    expect(channel.conexiones[0]).toEqual({ url: '/api/v1/events', autorizacion: 'Bearer token-secreto' })
  })

  it('entrega solo los avisos de su tema', async () => {
    const channel = noticesChannel()
    setAuthToken('t')
    const { recibidos: received } = listen(ORDERS)
    await waitFor(() => {
      expect(channel.conexiones).toHaveLength(1)
    })

    channel.emitir('cash', '{"id":1}')
    channel.emitir(ORDERS, '{"id":2}')

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
    expect(channel.conexiones).toHaveLength(0)
  })

  it('si el canal se corta, reintenta a los tres segundos', async () => {
    jest.useFakeTimers()
    const channel = noticesChannel()
    setAuthToken('t')
    listen(ORDERS)
    await jest.advanceTimersByTimeAsync(0)
    expect(channel.conexiones).toHaveLength(1)

    channel.cortar()
    await jest.advanceTimersByTimeAsync(2999)
    expect(channel.conexiones).toHaveLength(1)
    await jest.advanceTimersByTimeAsync(1)
    expect(channel.conexiones).toHaveLength(2)
  })

  it('con 401 no reintenta: la credencial no va a mejorar sola', async () => {
    jest.useFakeTimers()
    const channel = noticesChannel()
    channel.responderCon(401)
    setAuthToken('vencido')
    listen(ORDERS)

    await jest.advanceTimersByTimeAsync(10_000)
    expect(channel.conexiones).toHaveLength(1)
  })

  it('al desmontarse cierra la conexión y no reintenta', async () => {
    jest.useFakeTimers()
    const channel = noticesChannel()
    setAuthToken('t')
    const { unmount } = listen(ORDERS)
    await jest.advanceTimersByTimeAsync(0)

    unmount()
    await jest.advanceTimersByTimeAsync(10_000)
    expect(channel.conexiones).toHaveLength(1)
  })
})
