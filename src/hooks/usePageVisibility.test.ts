import { afterEach, describe, expect, it, jest } from '@jest/globals'
import { act, renderHook } from '@testing-library/react'

import { onSubmit } from './formSubmit'
import { usePageVisibility } from './usePageVisibility'

function ponerVisibilidad(estado: DocumentVisibilityState) {
  Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => estado })
  document.dispatchEvent(new Event('visibilitychange'))
}

afterEach(() => {
  ponerVisibilidad('visible')
})

describe('usePageVisibility', () => {
  it('sigue a la pestaña cuando pasa al fondo y vuelve', () => {
    const { result } = renderHook(() => usePageVisibility())
    expect(result.current).toBe('visible')

    act(() => {
      ponerVisibilidad('hidden')
    })
    expect(result.current).toBe('hidden')

    act(() => {
      ponerVisibilidad('visible')
    })
    expect(result.current).toBe('visible')
  })
})

describe('onSubmit', () => {
  it('llama al envío de react-hook-form con el evento y no devuelve la promesa', () => {
    const recibidos: unknown[] = []
    const envio = (evento: unknown) => {
      recibidos.push(evento)
      return Promise.resolve('enviado')
    }
    const evento = { preventDefault: jest.fn() } as unknown as Parameters<ReturnType<typeof onSubmit>>[0]
    const enviar: (e: typeof evento) => unknown = onSubmit(envio)

    expect(enviar(evento)).toBeUndefined()
    expect(recibidos).toEqual([evento])
  })
})
