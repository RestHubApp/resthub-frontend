/**
 * @jest-environment ./jest/nodeEnvironment.cjs
 */
// Simula una pestaña sin DOM (location, window y almacenamiento de prueba),
// como corría con Vitest: en jsdom, `window.location` no se puede reemplazar.
import { afterEach, describe, expect, it, jest } from '@jest/globals'
import { stubGlobal, unstubAllGlobals } from '#jest/globals'

import type * as Auth from '../../api/auth'

// La fábrica de `jest.mock` corre al importar el módulo, después de esta línea:
// Jest solo le deja usar variables con prefijo `mock`.
const mockExchangePreviewCode = jest.fn<typeof Auth.exchangePreviewCode>()
const exchangePreviewCode = mockExchangePreviewCode

jest.mock('../../api/auth', () => ({
  ...jest.requireActual<typeof Auth>('../../api/auth'),
  exchangePreviewCode: mockExchangePreviewCode,
}))

function memoria(inicial: Record<string, string> = {}) {
  const datos = new Map(Object.entries(inicial))
  return {
    getItem: (clave: string) => datos.get(clave) ?? null,
    setItem: (clave: string, valor: string) => {
      datos.set(clave, valor)
    },
    removeItem: (clave: string) => {
      datos.delete(clave)
    },
    datos,
  }
}

interface Carga {
  /** La dirección con que se cargó la página: decide si la pestaña es de vista previa. */
  readonly cargadaEn: string
  /** Adónde se llegó navegando dentro de la aplicación antes de correr el `loader`. */
  readonly navegoA?: string
}

// Cada prueba es una página recién cargada: la pestaña elige su almacenamiento al importar.
async function pagina({ cargadaEn, navegoA }: Carga) {
  const location = { pathname: '', search: '', hash: '', replace: jest.fn(), reload: jest.fn() }
  const ir = (url: string) => {
    const { pathname, search, hash } = new URL(url, 'http://localhost')
    Object.assign(location, { pathname, search, hash })
  }
  // Como el navegador: reescribir el historial cambia la dirección sin cargar la página.
  const history = { state: null, replaceState: jest.fn((_: unknown, __: string, url: string) => {
      ir(url)
    }),
  }
  ir(cargadaEn)
  stubGlobal('location', location)
  stubGlobal('history', history)
  stubGlobal('window', { location, history, addEventListener: jest.fn() })
  stubGlobal('localStorage', memoria())
  stubGlobal('sessionStorage', memoria())
  jest.resetModules()
  exchangePreviewCode.mockReset()
  const modulo = await import('./previewEntry')
  if (navegoA !== undefined) {
    ir(navegoA)
  }
  return { ...modulo, location, history }
}

afterEach(() => {
  unstubAllGlobals()
})

describe('previewEntryLoader', () => {
  it('si se llegó navegando desde una pestaña normal, carga una vez la ruta de canje de la aplicación', async () => {
    const { previewEntryLoader, location } = await pagina({ cargadaEn: '/pedidos', navegoA: '/Vista-Previa#codigo=abc' })

    expect(await previewEntryLoader()).toBe('reloading')

    expect(location.reload).not.toHaveBeenCalled()
    expect(location.replace).toHaveBeenCalledTimes(1)
    expect(location.replace).toHaveBeenCalledWith('/vista-previa#codigo=abc')
    expect(exchangePreviewCode).not.toHaveBeenCalled()
  })

  it('una pestaña cargada en la ruta escrita con mayúsculas o escapes canjea sin recargar', async () => {
    for (const ruta of ['/Vista-Previa', '/vista%2Dprevia/']) {
      const { previewEntryLoader, location } = await pagina({ cargadaEn: `${ruta}#codigo=abc` })
      exchangePreviewCode.mockRejectedValue(new Error('sin red'))

      expect(await previewEntryLoader()).toBe('offline')

      expect(location.reload).not.toHaveBeenCalled()
      expect(location.replace).not.toHaveBeenCalled()
      expect(exchangePreviewCode).toHaveBeenCalledTimes(1)
      expect(exchangePreviewCode).toHaveBeenCalledWith({ code: 'abc' })
    }
  })

  it('el código ya salió de la barra al cargar la página y el canje lo toma de la memoria', async () => {
    const { previewEntryLoader, location } = await pagina({ cargadaEn: '/vista-previa#codigo=abc' })
    // Antes de bajar la pantalla de canje: si su archivo no llegara, el código ya no está.
    expect(location.hash).toBe('')
    exchangePreviewCode.mockRejectedValue(new Error('sin red'))

    await previewEntryLoader()

    expect(exchangePreviewCode).toHaveBeenCalledTimes(1)
    expect(exchangePreviewCode).toHaveBeenCalledWith({ code: 'abc' })
  })
})
