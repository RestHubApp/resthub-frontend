import { afterEach, describe, expect, it, jest } from '@jest/globals'
import { renderHook, waitFor } from '@testing-library/react'

import { canalDeAvisos } from '#jest/canal'
import { setAuthToken } from '../services/api'
import { useServerEvent } from './useServerEvent'

const PEDIDOS = 'orders'

function escuchar(topic: string, enabled = true) {
  const recibidos: string[] = []
  const vista = renderHook(() => {
    useServerEvent(topic, (datos) => recibidos.push(datos), enabled)
  })
  return { recibidos, ...vista }
}

afterEach(() => {
  jest.useRealTimers()
})

describe('useServerEvent', () => {
  it('abre el canal con el token en la cabecera, nunca en la URL', async () => {
    const canal = canalDeAvisos()
    setAuthToken('token-secreto')
    escuchar(PEDIDOS)

    await waitFor(() => {
      expect(canal.conexiones).toHaveLength(1)
    })
    expect(canal.conexiones[0]).toEqual({ url: '/api/v1/events', autorizacion: 'Bearer token-secreto' })
  })

  it('entrega solo los avisos de su tema', async () => {
    const canal = canalDeAvisos()
    setAuthToken('t')
    const { recibidos } = escuchar(PEDIDOS)
    await waitFor(() => {
      expect(canal.conexiones).toHaveLength(1)
    })

    canal.emitir('cash', '{"id":1}')
    canal.emitir(PEDIDOS, '{"id":2}')

    await waitFor(() => {
      expect(recibidos).toEqual(['{"id":2}'])
    })
  })

  it('sin sesión o desactivado no abre ninguna conexión', () => {
    const canal = canalDeAvisos()
    setAuthToken(null)
    escuchar(PEDIDOS)
    setAuthToken('t')
    escuchar(PEDIDOS, false)
    expect(canal.conexiones).toHaveLength(0)
  })

  it('si el canal se corta, reintenta a los tres segundos', async () => {
    jest.useFakeTimers()
    const canal = canalDeAvisos()
    setAuthToken('t')
    escuchar(PEDIDOS)
    await jest.advanceTimersByTimeAsync(0)
    expect(canal.conexiones).toHaveLength(1)

    canal.cortar()
    await jest.advanceTimersByTimeAsync(2999)
    expect(canal.conexiones).toHaveLength(1)
    await jest.advanceTimersByTimeAsync(1)
    expect(canal.conexiones).toHaveLength(2)
  })

  it('con 401 no reintenta: la credencial no va a mejorar sola', async () => {
    jest.useFakeTimers()
    const canal = canalDeAvisos()
    canal.responderCon(401)
    setAuthToken('vencido')
    escuchar(PEDIDOS)

    await jest.advanceTimersByTimeAsync(10_000)
    expect(canal.conexiones).toHaveLength(1)
  })

  it('al desmontarse cierra la conexión y no reintenta', async () => {
    jest.useFakeTimers()
    const canal = canalDeAvisos()
    setAuthToken('t')
    const { unmount } = escuchar(PEDIDOS)
    await jest.advanceTimersByTimeAsync(0)

    unmount()
    await jest.advanceTimersByTimeAsync(10_000)
    expect(canal.conexiones).toHaveLength(1)
  })
})
