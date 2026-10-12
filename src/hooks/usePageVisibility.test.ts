import { afterEach, describe, expect, it, jest } from '@jest/globals'
import { act, renderHook } from '@testing-library/react'

import { onSubmit } from './formSubmit'
import { usePageVisibility } from './usePageVisibility'

function putVisibility(status: DocumentVisibilityState) {
  Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => status })
  document.dispatchEvent(new Event('visibilitychange'))
}

afterEach(() => {
  putVisibility('visible')
})

describe('usePageVisibility', () => {
  it('sigue a la pestaña cuando pasa al fondo y vuelve', () => {
    const { result } = renderHook(() => usePageVisibility())
    expect(result.current).toBe('visible')

    act(() => {
      putVisibility('hidden')
    })
    expect(result.current).toBe('hidden')

    act(() => {
      putVisibility('visible')
    })
    expect(result.current).toBe('visible')
  })
})

describe('onSubmit', () => {
  it('llama al envío de react-hook-form con el evento y no devuelve la promesa', () => {
    const received: unknown[] = []
    const sending = (event: unknown) => {
      received.push(event)
      return Promise.resolve('enviado')
    }
    const fakeEvent = { preventDefault: jest.fn() } as unknown as Parameters<ReturnType<typeof onSubmit>>[0]
    const send: (e: typeof fakeEvent) => unknown = onSubmit(sending)

    expect(send(fakeEvent)).toBeUndefined()
    expect(received).toEqual([fakeEvent])
  })
})
