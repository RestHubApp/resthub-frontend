import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals'
import { QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { createElement, type ReactNode } from 'react'

import { signInAs } from '#jest/harness'
import { mswServer } from '#jest/mswServer'
import { queryClient } from '@/services/queryClient'
import { useLiveUpdates } from './useLiveUpdates'

// Un canal de avisos controlado por la prueba: cada conexión es un flujo al
// que se le escriben eventos, o una respuesta de error.
interface Connection {
  readonly url: string
  readonly headers: Headers
  write: (text: string) => void
  close: () => void
}

const connections: Connection[] = []
let responseStatus = 200

function fakeChannel({ request }: { readonly request: Request }): Response {
  let handler: ReadableStreamDefaultController<Uint8Array> | null = null
  const flow = new ReadableStream<Uint8Array>({
    start(c) {
      handler = c
    },
  })
  const encoder = new TextEncoder()
  connections.push({
    url: request.url,
    headers: request.headers,
    write: (text) => handler?.enqueue(encoder.encode(text)),
    close: () => handler?.close(),
  })
  const body = responseStatus === 200 ? flow : null
  return new HttpResponse(body, { status: responseStatus })
}

function wrapper({ children }: { readonly children: ReactNode }) {
  return createElement(QueryClientProvider, { client: queryClient }, children)
}

function listen() {
  signInAs()
  return renderHook(() => useLiveUpdates(), { wrapper })
}

function notice(type: string) {
  act(() => {
    connections.at(-1)?.write(`event: ${type}\ndata: {}\n\n`)
  })
}

function invalidated(key: readonly unknown[]): boolean | undefined {
  return queryClient.getQueryState(key)?.isInvalidated
}

beforeEach(() => {
  connections.length = 0
  responseStatus = 200
  mswServer.use(http.get('*/api/v1/events', fakeChannel))
  queryClient.setQueryData(['orders', 'active'], [])
  queryClient.setQueryData(['tables', { includeInactive: false }], [])
  queryClient.setQueryData(['menu', 'pedidos'], { categories: [] })
})

afterEach(() => {
  jest.useRealTimers()
})

describe('useLiveUpdates', () => {
  it('abre el canal con el token en la cabecera y pasa a «en vivo» con el aviso ready', async () => {
    const { result } = listen()
    expect(result.current).toBe('connecting')
    await waitFor(() => {
      expect(connections).toHaveLength(1)
    })
    expect(connections[0]?.url).toBe('http://localhost/api/v1/events')
    expect(connections[0]?.headers.get('Authorization')).toBe('Bearer token-de-prueba')

    notice('ready')
    await waitFor(() => {
      expect(result.current).toBe('live')
    })
  })

  it('un aviso de pedidos invalida pedidos y mesas, pero no la carta', async () => {
    listen()
    await waitFor(() => {
      expect(connections).toHaveLength(1)
    })
    notice('ready')
    notice('orders')
    await waitFor(() => {
      expect(invalidated(['orders', 'active'])).toBe(true)
    })
    expect(invalidated(['tables', { includeInactive: false }])).toBe(true)
    expect(invalidated(['menu', 'pedidos'])).toBe(false)
  })

  it('si el canal se corta, reintenta y al reconectar vuelve a pedir todo', async () => {
    jest.useFakeTimers()
    const { result } = listen()
    await waitFor(() => {
      expect(connections).toHaveLength(1)
    })
    notice('ready')
    act(() => {
      connections[0]?.close()
    })
    await waitFor(() => {
      expect(result.current).toBe('offline')
    })
    await act(async () => {
      await jest.advanceTimersByTimeAsync(3000)
    })
    expect(connections).toHaveLength(2)
    notice('ready')
    await waitFor(() => {
      expect(invalidated(['menu', 'pedidos'])).toBe(true)
    })
    expect(result.current).toBe('live')
  })

  it('un 401 no se reintenta: la credencial ya no vale', async () => {
    jest.useFakeTimers()
    responseStatus = 401
    const { result } = listen()
    await waitFor(() => {
      expect(result.current).toBe('offline')
    })
    await act(async () => {
      await jest.advanceTimersByTimeAsync(10_000)
    })
    expect(connections).toHaveLength(1)
  })

  it('sin sesión no abre ningún canal', () => {
    const { result } = renderHook(() => useLiveUpdates(), { wrapper })
    expect(result.current).toBe('connecting')
    expect(connections).toHaveLength(0)
  })
})
