/**
 * @jest-environment ./jest/nodeEnvironment.cjs
 */
// Simula una pestaña sin DOM (location, window y almacenamiento de prueba),
// como corría con Vitest: en jsdom, `window.location` no se puede reemplazar.
import { afterEach, describe, expect, it, jest } from '@jest/globals'
import { stubGlobal, unstubAllGlobals } from '#jest/globals'

import { HttpResponse, http } from 'msw'

import { mswServer } from '#jest/mswServer'

// Cada canje que llega al servidor: el cuerpo que salió.
const exchanges: unknown[] = []

const LOADED_WITH_CODE = '/vista-previa#codigo=abc'

function previewServerCuts(): void {
  mswServer.use(
    http.post('*/api/v1/auth/preview', async ({ request }) => {
      exchanges.push(await request.json())
      return HttpResponse.error()
    }),
  )
}

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
  /** Adónde se llegó navegando dentro de la aplicación antes de llegar a la ruta de canje. */
  readonly browsedTo?: string
}

// Cada prueba es una página recién cargada: la pestaña elige su almacenamiento al importar.
async function page({ loadedIn, browsedTo }: Load) {
  const location = { origin: 'http://localhost', pathname: '', search: '', hash: '', replace: jest.fn(), reload: jest.fn() }
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
  exchanges.length = 0
  const modulo = await import('./previewEntry')
  if (browsedTo !== undefined) {
    ir(browsedTo)
  }
  return { ...modulo, location, history }
}

afterEach(() => {
  unstubAllGlobals()
})

describe('enterPreview', () => {
  it('si se llegó navegando desde una pestaña normal, carga una vez la ruta de canje de la aplicación', async () => {
    const { enterPreview, location } = await page({ loadedIn: '/pedidos', browsedTo: '/Vista-Previa#codigo=abc' })

    expect(await enterPreview()).toBe('reloading')

    expect(location.reload).not.toHaveBeenCalled()
    expect(location.replace).toHaveBeenCalledTimes(1)
    expect(location.replace).toHaveBeenCalledWith(LOADED_WITH_CODE)
    expect(exchanges).toEqual([])
  })

  it('una pestaña cargada en la ruta escrita con mayúsculas o escapes canjea sin recargar', async () => {
    for (const route of ['/Vista-Previa', '/vista%2Dprevia/']) {
      const { enterPreview, location } = await page({ loadedIn: `${route}#codigo=abc` })
      previewServerCuts()

      expect(await enterPreview()).toBe('offline')

      expect(location.reload).not.toHaveBeenCalled()
      expect(location.replace).not.toHaveBeenCalled()
      expect(exchanges).toEqual([{ code: 'abc' }])
    }
  })

  it('el código ya salió de la barra al cargar la página y el canje lo toma de la memoria', async () => {
    const { enterPreview, location } = await page({ loadedIn: LOADED_WITH_CODE })
    // Antes de bajar la pantalla de canje: si su archivo no llegara, el código ya no está.
    expect(location.hash).toBe('')
    previewServerCuts()

    await enterPreview()

    expect(exchanges).toEqual([{ code: 'abc' }])
  })
})

describe('enterPreviewOnce', () => {
  it('canjea una sola vez por llegada aunque la pantalla se renderice dos veces (modo estricto)', async () => {
    previewServerCuts()
    const { enterPreviewOnce } = await page({ loadedIn: LOADED_WITH_CODE })

    const first = enterPreviewOnce('default')
    const second = enterPreviewOnce('default')

    expect(second).toBe(first)
    expect(await first).toBe('offline')
    expect(exchanges).toEqual([{ code: 'abc' }])
  })

  it('volver a la ruta es otra navegación: corre de nuevo, ya sin código', async () => {
    previewServerCuts()
    const { enterPreviewOnce } = await page({ loadedIn: LOADED_WITH_CODE })

    expect(await enterPreviewOnce('default')).toBe('offline')
    expect(await enterPreviewOnce('otra-navegacion')).toBe('missing')
    expect(exchanges).toEqual([{ code: 'abc' }])
  })

  it('con el canje aceptado entra con la sesión de vista previa', async () => {
    mswServer.use(
      http.post('*/api/v1/auth/preview', () =>
        HttpResponse.json({
          access_token: 'token-de-vista-previa',
          expires_in: 1800,
          token_type: 'bearer',
          kind: 'staff',
          user: { id: 7, email: 'ana@resthub.dev', full_name: 'Ana Torres', role_id: 2, role_label: 'Mesero' },
          restaurant: { id: 1, name: 'Local de muestra', slug: 'muestra', timezone: 'America/Lima' },
          permissions: [],
          preview: true,
        }),
      ),
    )
    const { enterPreviewOnce } = await page({ loadedIn: LOADED_WITH_CODE })
    const { useSession } = await import('@/store/session')

    expect(await enterPreviewOnce('default')).toBe('entered')
    expect(useSession.getState().account?.preview).toBe(true)
  })
})
