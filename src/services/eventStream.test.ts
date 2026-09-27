/**
 * @jest-environment node
 */
import { afterEach, expect, it, jest } from '@jest/globals'

import { readEventStream } from './eventStream'

const originalFetch = globalThis.fetch

afterEach(() => {
  jest.useRealTimers()
  globalThis.fetch = originalFetch
})

it('abandona un canal SSE congelado y permite que el llamador reconecte', async () => {
  jest.useFakeTimers()
  const cancel = jest.fn()
  globalThis.fetch = jest.fn((_url: string | URL | Request, init?: RequestInit) => {
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('event: ready\ndata: {}\n\n'))
        init?.signal?.addEventListener('abort', () => {
          cancel()
          controller.error(new DOMException('Canal detenido', 'AbortError'))
        })
      },
    })
    return Promise.resolve(new Response(stream))
  })
  const onEvent = jest.fn()
  const reading = readEventStream({
    url: '/api/v1/events', token: 'local', signal: new AbortController().signal, onEvent,
  }).then(() => null, (error: unknown) => error)
  // Deja correr las microtareas hasta que llega el aviso «ready».
  for (let i = 0; i < 50 && onEvent.mock.calls.length === 0; i += 1) {
    await jest.advanceTimersByTimeAsync(0)
  }
  expect(onEvent).toHaveBeenCalledWith({ type: 'ready', data: '{}' })
  await jest.advanceTimersByTimeAsync(35_001)
  // En el entorno node de Jest, DOMException viene de otro contexto y no pasa
  // `instanceof Error`: se compara por nombre.
  expect(await reading).toMatchObject({ name: 'AbortError' })
  expect(cancel).toHaveBeenCalled()
})
