/**
 * @jest-environment ./jest/nodeEnvironment.cjs
 */
// Simula una pestaña sin DOM (location, window y almacenamiento de prueba),
// como corría con Vitest: en jsdom, `window.location` no se puede reemplazar.
import { afterEach, describe, expect, it, jest } from '@jest/globals'
import { stubGlobal, unstubAllGlobals } from '#jest/globals'

import type * as Auth from '@/api/auth'

// La fábrica de `jest.mock` corre al importar el módulo, después de esta línea:
// Jest solo le deja usar variables con prefijo `mock`.
const mockExchangePreviewCode = jest.fn<typeof Auth.exchangePreviewCode>()
const exchangePreviewCode = mockExchangePreviewCode

jest.mock('@/api/auth', () => ({
  ...jest.requireActual<typeof Auth>('@/api/auth'),
  exchangePreviewCode: mockExchangePreviewCode,
}))

function memory(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial))
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => {
      data.set(key, value)
    },
    removeItem: (key: string) => {
      data.delete(key)
    },
    data,
  }
}

interface Load {
  /** La dirección con que se cargó la página: decide si la pestaña es de vista previa. */
  readonly loadedIn: string
  /** Adónde se llegó navegando dentro de la aplicación antes de correr el `loader`. */
  readonly browsedTo?: string
}

// Cada prueba es una página recién cargada: la pestaña elige su almacenamiento al importar.
async function page({ loadedIn, browsedTo }: Load) {
  const location = { pathname: '', search: '', hash: '', replace: jest.fn(), reload: jest.fn() }
  const ir = (url: string) => {
    const { pathname, search, hash } = new URL(url, 'http://localhost')
    Object.assign(location, { pathname, search, hash })
  }
  // Como el navegador: reescribir el historial cambia la dirección sin cargar la página.
  const history = { state: null, replaceState: jest.fn((_: unknown, _title: string, url: string) => {
      ir(url)
    }),
  }
  ir(loadedIn)
  stubGlobal('location', location)
  stubGlobal('history', history)
  stubGlobal('window', { location, history, addEventListener: jest.fn() })
  stubGlobal('localStorage', memory())
  stubGlobal('sessionStorage', memory())
  jest.resetModules()
  exchangePreviewCode.mockReset()
  const modulo = await import('./previewEntry')
  if (browsedTo !== undefined) {
    ir(browsedTo)
  }
  return { ...modulo, location, history }
}

afterEach(() => {
  unstubAllGlobals()
})

describe('previewEntryLoader', () => {
  it('si se llegó navegando desde una pestaña normal, carga una vez la ruta de canje de la aplicación', async () => {
    const { previewEntryLoader, location } = await page({ loadedIn: '/pedidos', browsedTo: '/Vista-Previa#codigo=abc' })

    expect(await previewEntryLoader()).toBe('reloading')

    expect(location.reload).not.toHaveBeenCalled()
    expect(location.replace).toHaveBeenCalledTimes(1)
    expect(location.replace).toHaveBeenCalledWith('/vista-previa#codigo=abc')
    expect(exchangePreviewCode).not.toHaveBeenCalled()
  })

  it('una pestaña cargada en la ruta escrita con mayúsculas o escapes canjea sin recargar', async () => {
    for (const route of ['/Vista-Previa', '/vista%2Dprevia/']) {
      const { previewEntryLoader, location } = await page({ loadedIn: `${route}#codigo=abc` })
      exchangePreviewCode.mockRejectedValue(new Error('sin red'))

      expect(await previewEntryLoader()).toBe('offline')

      expect(location.reload).not.toHaveBeenCalled()
      expect(location.replace).not.toHaveBeenCalled()
      expect(exchangePreviewCode).toHaveBeenCalledTimes(1)
      expect(exchangePreviewCode).toHaveBeenCalledWith({ code: 'abc' })
    }
  })

  it('el código ya salió de la barra al cargar la página y el canje lo toma de la memoria', async () => {
    const { previewEntryLoader, location } = await page({ loadedIn: '/vista-previa#codigo=abc' })
    // Antes de bajar la pantalla de canje: si su archivo no llegara, el código ya no está.
    expect(location.hash).toBe('')
    exchangePreviewCode.mockRejectedValue(new Error('sin red'))

    await previewEntryLoader()

    expect(exchangePreviewCode).toHaveBeenCalledTimes(1)
    expect(exchangePreviewCode).toHaveBeenCalledWith({ code: 'abc' })
  })
})
