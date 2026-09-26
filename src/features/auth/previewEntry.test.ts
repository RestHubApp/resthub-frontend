import { afterEach, describe, expect, it, vi } from 'vitest'

import type * as Auth from '../../api/auth'

const { exchangePreviewCode } = vi.hoisted(() => ({ exchangePreviewCode: vi.fn() }))

vi.mock('../../api/auth', async (importOriginal) => ({
  ...(await importOriginal<typeof Auth>()),
  exchangePreviewCode,
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
  /** Dónde se cargó la página: decide si la pestaña es de vista previa. */
  readonly cargadaEn: string
  /** Dónde está al correr el `loader` (otra ruta si se llegó navegando). */
  readonly ahora?: { pathname: string; search?: string; hash?: string }
  readonly pestana?: Record<string, string>
}

// Cada prueba es una página recién cargada: la pestaña elige su almacenamiento al importar.
async function pagina({ cargadaEn, ahora, pestana = {} }: Carga) {
  const location = {
    pathname: cargadaEn,
    search: '',
    hash: '',
    replace: vi.fn(),
    reload: vi.fn(),
  }
  const history = { state: null, replaceState: vi.fn() }
  vi.stubGlobal('location', location)
  vi.stubGlobal('history', history)
  vi.stubGlobal('window', { location, history })
  vi.stubGlobal('localStorage', memoria())
  vi.stubGlobal('sessionStorage', memoria(pestana))
  vi.resetModules()
  exchangePreviewCode.mockReset()
  const modulo = await import('./previewEntry')
  Object.assign(location, { search: '', hash: '', ...ahora })
  return { ...modulo, location, history }
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('previewEntryLoader', () => {
  it('si se llegó navegando desde una pestaña normal, carga una vez la ruta de canje de la aplicación', async () => {
    const { previewEntryLoader, location } = await pagina({
      cargadaEn: '/pedidos',
      ahora: { pathname: '/Vista-Previa', hash: '#codigo=abc' },
    })

    expect(await previewEntryLoader()).toBe('reloading')

    expect(location.reload).not.toHaveBeenCalled()
    expect(location.replace).toHaveBeenCalledExactlyOnceWith('/vista-previa#codigo=abc')
    expect(exchangePreviewCode).not.toHaveBeenCalled()
  })

  it('una pestaña cargada en la ruta escrita con mayúsculas o escapes canjea sin recargar', async () => {
    for (const ruta of ['/Vista-Previa', '/vista%2Dprevia/']) {
      const { previewEntryLoader, location } = await pagina({ cargadaEn: ruta, ahora: { pathname: ruta, hash: '#codigo=abc' } })
      exchangePreviewCode.mockRejectedValue(new Error('sin red'))

      expect(await previewEntryLoader()).toBe('offline')

      expect(location.reload).not.toHaveBeenCalled()
      expect(location.replace).not.toHaveBeenCalled()
      expect(exchangePreviewCode).toHaveBeenCalledExactlyOnceWith({ code: 'abc' })
    }
  })
})
