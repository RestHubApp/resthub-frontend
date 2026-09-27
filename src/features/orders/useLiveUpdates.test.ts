import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals'
import { QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import { createElement, type ReactNode } from 'react'

import { entrarComo } from '#jest/harness'
import { queryClient } from '../../services/queryClient'
import { useLiveUpdates } from './useLiveUpdates'

// Un canal de avisos controlado por la prueba: cada conexión es un flujo al
// que se le escriben eventos, o una respuesta de error.
interface Conexion {
  readonly url: string
  readonly headers: Headers
  escribir: (texto: string) => void
  cerrar: () => void
}

const conexiones: Conexion[] = []
let estadoDeRespuesta = 200
const fetchOriginal = window.fetch.bind(window)

function canalFalso(entrada: RequestInfo | URL, opciones?: RequestInit): Promise<Response> {
  let controlador: ReadableStreamDefaultController<Uint8Array> | null = null
  const flujo = new ReadableStream<Uint8Array>({
    start(c) {
      controlador = c
    },
  })
  const codificador = new TextEncoder()
  conexiones.push({
    url: entrada instanceof Request ? entrada.url : entrada.toString(),
    headers: new Headers(opciones?.headers),
    escribir: (texto) => controlador?.enqueue(codificador.encode(texto)),
    cerrar: () => controlador?.close(),
  })
  const cuerpo = estadoDeRespuesta === 200 ? flujo : null
  return Promise.resolve(new Response(cuerpo, { status: estadoDeRespuesta }))
}

function envoltorio({ children }: { readonly children: ReactNode }) {
  return createElement(QueryClientProvider, { client: queryClient }, children)
}

function escuchar() {
  entrarComo()
  return renderHook(() => useLiveUpdates(), { wrapper: envoltorio })
}

function aviso(tipo: string) {
  act(() => {
    conexiones.at(-1)?.escribir(`event: ${tipo}\ndata: {}\n\n`)
  })
}

function invalidada(clave: readonly unknown[]): boolean | undefined {
  return queryClient.getQueryState(clave)?.isInvalidated
}

beforeEach(() => {
  conexiones.length = 0
  estadoDeRespuesta = 200
  window.fetch = canalFalso
  queryClient.setQueryData(['orders', 'active'], [])
  queryClient.setQueryData(['tables', { includeInactive: false }], [])
  queryClient.setQueryData(['menu', 'pedidos'], { categories: [] })
})

afterEach(() => {
  window.fetch = fetchOriginal
  jest.useRealTimers()
})

describe('useLiveUpdates', () => {
  it('abre el canal con el token en la cabecera y pasa a «en vivo» con el aviso ready', async () => {
    const { result } = escuchar()
    expect(result.current).toBe('connecting')
    await waitFor(() => {
      expect(conexiones).toHaveLength(1)
    })
    expect(conexiones[0]?.url).toBe('/api/v1/events')
    expect(conexiones[0]?.headers.get('Authorization')).toBe('Bearer token-de-prueba')

    aviso('ready')
    await waitFor(() => {
      expect(result.current).toBe('live')
    })
  })

  it('un aviso de pedidos invalida pedidos y mesas, pero no la carta', async () => {
    escuchar()
    await waitFor(() => {
      expect(conexiones).toHaveLength(1)
    })
    aviso('ready')
    aviso('orders')
    await waitFor(() => {
      expect(invalidada(['orders', 'active'])).toBe(true)
    })
    expect(invalidada(['tables', { includeInactive: false }])).toBe(true)
    expect(invalidada(['menu', 'pedidos'])).toBe(false)
  })

  it('si el canal se corta, reintenta y al reconectar vuelve a pedir todo', async () => {
    jest.useFakeTimers()
    const { result } = escuchar()
    await waitFor(() => {
      expect(conexiones).toHaveLength(1)
    })
    aviso('ready')
    act(() => {
      conexiones[0]?.cerrar()
    })
    await waitFor(() => {
      expect(result.current).toBe('offline')
    })
    await act(async () => {
      await jest.advanceTimersByTimeAsync(3000)
    })
    expect(conexiones).toHaveLength(2)
    aviso('ready')
    await waitFor(() => {
      expect(invalidada(['menu', 'pedidos'])).toBe(true)
    })
    expect(result.current).toBe('live')
  })

  it('un 401 no se reintenta: la credencial ya no vale', async () => {
    jest.useFakeTimers()
    estadoDeRespuesta = 401
    const { result } = escuchar()
    await waitFor(() => {
      expect(result.current).toBe('offline')
    })
    await act(async () => {
      await jest.advanceTimersByTimeAsync(10_000)
    })
    expect(conexiones).toHaveLength(1)
  })

  it('sin sesión no abre ningún canal', () => {
    const { result } = renderHook(() => useLiveUpdates(), { wrapper: envoltorio })
    expect(result.current).toBe('connecting')
    expect(conexiones).toHaveLength(0)
  })
})
