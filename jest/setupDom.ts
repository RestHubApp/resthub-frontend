// Se carga después del entorno (setupFilesAfterEnv): matchers de jest-dom y,
// en jsdom, lo que el navegador trae y jsdom no.
import '@testing-library/jest-dom/jest-globals'

import { cleanup, configure } from '@testing-library/react'
import { afterAll, afterEach, beforeAll } from '@jest/globals'

import { mswServer } from './mswServer'

// La primera pantalla perezosa se compila con Babel y puede tardar varios
// segundos. findBy* espera 1 s por defecto, menos que el testTimeout.
configure({ asyncUtilTimeout: 15_000 })

// MSW responde el API entero: una petición sin manejador falla la prueba en vez
// de salir a la red, y los manejadores de una prueba no pasan a la siguiente.
beforeAll(() => {
  mswServer.listen({ onUnhandledFrame: 'error' })
})

afterEach(() => {
  cleanup()
  mswServer.resetHandlers()
})

afterAll(() => {
  mswServer.close()
})

if (typeof window !== 'undefined') {
  // Radix y los diseños adaptables preguntan por media queries al montarse.
  if (!('matchMedia' in window)) {
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: (query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: () => undefined,
        removeListener: () => undefined,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
        dispatchEvent: () => false,
      }),
    })
  }
  // Radix mide los elementos con ResizeObserver; jsdom no tiene diseño.
  if (!('ResizeObserver' in window)) {
    class TestResizeObserver {
      observe = () => undefined
      unobserve = () => undefined
      disconnect = () => undefined
    }
    Object.defineProperty(window, 'ResizeObserver', { configurable: true, value: TestResizeObserver })
  }
  // jsdom no tiene diseño: las secciones que esperan a entrar en pantalla se
  // consideran visibles, que es lo que haría el navegador al mostrarlas.
  if (!('IntersectionObserver' in window)) {
    class TestIntersectionObserver {
      readonly root = null
      readonly rootMargin = ''
      readonly thresholds = [0]
      onView: IntersectionObserverCallback
      constructor(onView: IntersectionObserverCallback) {
        this.onView = onView
      }
      observe = (target: Element) => {
        this.onView([{ isIntersecting: true, target } as IntersectionObserverEntry], this as unknown as IntersectionObserver)
      }
      unobserve = () => undefined
      disconnect = () => undefined
      takeRecords = () => [] as IntersectionObserverEntry[]
    }
    Object.defineProperty(window, 'IntersectionObserver', { configurable: true, value: TestIntersectionObserver })
  }
  // Radix Select y los menús usan la captura de puntero y el desplazamiento.
  const element = window.HTMLElement.prototype as unknown as Record<string, unknown>
  element['hasPointerCapture'] ??= () => false
  element['releasePointerCapture'] ??= () => undefined
  element['scrollIntoView'] ??= () => undefined
  // jsdom avisa «Not implemented» y no hace nada: en las pruebas basta con eso, sin el aviso.
  window.scrollTo = () => undefined
  window.print = () => undefined
}
