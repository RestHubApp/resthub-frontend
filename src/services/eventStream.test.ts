/**
 * @jest-environment ./jest/nodeEnvironment.cjs
 */
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals'
import { HttpResponse, http } from 'msw'

import { mswServer } from '#jest/mswServer'

import { readEventStream } from './eventStream'
import { anyOf } from './signals'

afterEach(() => {
  jest.useRealTimers()
})

it('abandona un canal SSE congelado y permite que el llamador reconecte', async () => {
  // MSW espera con setImmediate y microtareas: no se falsean.
  jest.useFakeTimers({ doNotFake: ['setImmediate', 'nextTick', 'queueMicrotask'] })
  const cancel = jest.fn()
  mswServer.use(http.get('*/api/v1/events', ({ request }) => {
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('event: ready\ndata: {}\n\n'))
        request.signal.addEventListener('abort', () => {
          cancel()
          controller.error(new DOMException('Canal detenido', 'AbortError'))
        })
      },
    })
    return new HttpResponse(stream)
  }))
  const onEvent = jest.fn()
  const reading = readEventStream({
    url: 'http://localhost/api/v1/events', token: 'local', signal: new AbortController().signal, onEvent,
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

describe('cualquieraDe sin AbortSignal.any (Safari antes de 17.4)', () => {
  const original = Object.getOwnPropertyDescriptor(AbortSignal, 'any')

  beforeEach(() => {
    // @ts-expect-error -- se quita para simular un navegador viejo
    delete AbortSignal.any
  })

  afterEach(() => {
    if (original !== undefined) {
      Object.defineProperty(AbortSignal, 'any', original)
    }
  })

  it('se aborta con la primera de las dos y conserva su motivo', () => {
    const a = new AbortController()
    const b = new AbortController()
    const combined = anyOf(a.signal, b.signal)
    expect(combined.aborted).toBe(false)
    b.abort('inactivo')
    expect(combined.aborted).toBe(true)
    expect(combined.reason).toBe('inactivo')
  })

  it('nace abortada si una ya lo estaba', () => {
    const a = new AbortController()
    a.abort('cerrado')
    expect(anyOf(a.signal, new AbortController().signal).reason).toBe('cerrado')
  })
})
