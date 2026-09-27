import { afterEach, expect, it, vi } from 'vitest'

import { readEventStream } from './eventStream'

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

it('abandona un canal SSE congelado y permite que el llamador reconecte', async () => {
  vi.useFakeTimers()
  const cancel = vi.fn()
  vi.stubGlobal('fetch', vi.fn().mockImplementation((_url: string, init: RequestInit) => {
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('event: ready\ndata: {}\n\n'))
        init.signal?.addEventListener('abort', () => {
          cancel()
          controller.error(new DOMException('Canal detenido', 'AbortError'))
        })
      },
    })
    return Promise.resolve(new Response(stream))
  }))
  const onEvent = vi.fn()
  const reading = readEventStream({
    url: '/api/v1/events', token: 'local', signal: new AbortController().signal, onEvent,
  }).then(() => null, (error: unknown) => error)
  await vi.waitFor(() => { expect(onEvent).toHaveBeenCalledWith({ type: 'ready', data: '{}' }) })
  await vi.advanceTimersByTimeAsync(35_001)
  expect(await reading).toBeInstanceOf(Error)
  expect(cancel).toHaveBeenCalled()
})
