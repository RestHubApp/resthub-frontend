// Se carga después del entorno (setupFilesAfterEnv): matchers de jest-dom y,
// en jsdom, lo que el navegador trae y jsdom no.
import '@testing-library/jest-dom/jest-globals'

import { cleanup, configure } from '@testing-library/react'
import { afterEach } from '@jest/globals'

// La primera pantalla perezosa se compila con Babel y puede tardar varios
// segundos. findBy* espera 1 s por defecto, menos que el testTimeout.
configure({ asyncUtilTimeout: 15_000 })

afterEach(() => {
  cleanup()
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
    class ResizeObserverDePrueba {
      observe = () => undefined
      unobserve = () => undefined
      disconnect = () => undefined
    }
    Object.defineProperty(window, 'ResizeObserver', { configurable: true, value: ResizeObserverDePrueba })
  }
  // jsdom no tiene diseño: las secciones que esperan a entrar en pantalla se
  // consideran visibles, que es lo que haría el navegador al mostrarlas.
  if (!('IntersectionObserver' in window)) {
    class IntersectionObserverDePrueba {
      readonly root = null
      readonly rootMargin = ''
      readonly thresholds = [0]
      alVer: IntersectionObserverCallback
      constructor(alVer: IntersectionObserverCallback) {
        this.alVer = alVer
      }
      observe = (objetivo: Element) => {
        this.alVer([{ isIntersecting: true, target: objetivo } as IntersectionObserverEntry], this as unknown as IntersectionObserver)
      }
      unobserve = () => undefined
      disconnect = () => undefined
      takeRecords = () => [] as IntersectionObserverEntry[]
    }
    Object.defineProperty(window, 'IntersectionObserver', { configurable: true, value: IntersectionObserverDePrueba })
  }
  // Radix Select y los menús usan la captura de puntero y el desplazamiento.
  const elemento = window.HTMLElement.prototype as unknown as Record<string, unknown>
  elemento.hasPointerCapture ??= () => false
  elemento.releasePointerCapture ??= () => undefined
  elemento.scrollIntoView ??= () => undefined
  // jsdom avisa «Not implemented» y no hace nada: en las pruebas basta con eso, sin el aviso.
  window.scrollTo = () => undefined
  window.print = () => undefined
  // Nada sale a la red: una petición con `fetch` (el canal de avisos) queda
  // abierta hasta que se aborta, como una conexión que todavía no responde.
  // Las del API pasan por el adaptador de Axios de cada prueba.
  window.fetch = (_entrada: RequestInfo | URL, opciones?: RequestInit) =>
    new Promise<Response>((_resolver, rechazar) => {
      opciones?.signal?.addEventListener('abort', () => {
        rechazar(new DOMException('Abortado', 'AbortError'))
      })
    })
}
