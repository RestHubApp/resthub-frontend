/**
 * @jest-environment ./jest/nodeEnvironment.cjs
 */
// Simula una pestaña sin DOM (location, window y almacenamiento de prueba),
// como corría con Vitest: en jsdom, `window.location` no se puede reemplazar.
import { afterEach, describe, expect, it, jest } from '@jest/globals'
import { stubGlobal, unstubAllGlobals } from '#jest/globals'

import {
  appPath,
  captureEntryFragment,
  chooseTabStorage,
  isPreviewEntry,
  previewEntryUrl,
  PREVIEW_SESSION_KEY,
  PREVIEW_TAB_KEY,
  RESTAURANT_SESSION_KEY,
  type KeyValueStorage,
} from './tabStorage'

const ENTRY = '/vista-previa'
const ENTRY_WITH_BASE = '/app/vista-previa'
const FRAGMENT = '#codigo=abc'

function memory(initial: Record<string, string> = {}): KeyValueStorage {
  const data = new Map(Object.entries(initial))
  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => {
      data.set(key, value)
    },
    removeItem: (key) => {
      data.delete(key)
    },
  }
}

describe('isPreviewEntry', () => {
  it('reconoce la ruta de canje, con o sin barra final', () => {
    expect(isPreviewEntry(ENTRY, '/')).toBe(true)
    expect(isPreviewEntry('/vista-previa/', '/')).toBe(true)
  })

  it('respeta la base de la aplicación, como el router', () => {
    expect(isPreviewEntry(ENTRY_WITH_BASE, '/app/')).toBe(true)
    expect(isPreviewEntry('/APP/vista-previa', '/app/')).toBe(true)
    expect(isPreviewEntry('/app/pedidos', '/app/')).toBe(false)
    // Fuera de la base el router no muestra ninguna ruta.
    expect(isPreviewEntry(ENTRY, '/app/')).toBe(false)
    expect(isPreviewEntry('/appx/vista-previa', '/app/')).toBe(false)
  })

  it('la reconoce escrita como la acepta el router: mayúsculas, escapes y barras finales', () => {
    expect(isPreviewEntry('/Vista-Previa', '/')).toBe(true)
    expect(isPreviewEntry('/VISTA-PREVIA/', '/')).toBe(true)
    expect(isPreviewEntry('/vista%2Dprevia', '/')).toBe(true)
    expect(isPreviewEntry('/vista%2dPrevia//', '/')).toBe(true)
    expect(isPreviewEntry('/app/Vista%2DPrevia', '/app/')).toBe(true)
  })

  it('no la confunde con una barra escapada ni con un escape roto', () => {
    expect(isPreviewEntry('/vista-previa%2F', '/')).toBe(false)
    expect(isPreviewEntry('/vista%2-previa', '/')).toBe(false)
  })

  it('no confunde otras rutas', () => {
    expect(isPreviewEntry('/', '/')).toBe(false)
    expect(isPreviewEntry('/vista-previa-x', '/')).toBe(false)
    expect(isPreviewEntry('/plataforma/vista-previa', '/')).toBe(false)
  })
})

describe('appPath', () => {
  it('deja la ruta como la compara el router', () => {
    expect(appPath('/Tablero/Historial/', '/')).toBe('/tablero/historial')
    expect(appPath('/app', '/app')).toBe('/')
    expect(appPath('/otra/tablero', '/app/')).toBeNull()
  })
})

describe('previewEntryUrl', () => {
  it('es la ruta de canje con la base, y al cargarla la pestaña es de vista previa', () => {
    for (const base of ['/', '/app/', '/App']) {
      const url = previewEntryUrl(base)
      expect(isPreviewEntry(url, base)).toBe(true)
      expect(chooseTabStorage({ pathname: url, base, local: memory(), tab: memory() }).kind).toBe('preview')
    }
    expect(previewEntryUrl('/app/')).toBe(ENTRY_WITH_BASE)
  })
})

describe('chooseTabStorage', () => {
  it('una pestaña cargada en la ruta de canje escrita en mayúsculas es de vista previa', () => {
    expect(chooseTabStorage({ pathname: '/Vista-Previa', base: '/', local: memory(), tab: memory() }).kind).toBe(
      'preview',
    )
  })

  it('una pestaña normal usa localStorage y la clave de siempre', () => {
    const local = memory()
    const selected = chooseTabStorage({ pathname: '/pedidos', base: '/', local, tab: memory() })
    expect(selected).toEqual({ kind: 'restaurant', storage: local, sessionKey: RESTAURANT_SESSION_KEY })
  })

  it('la pestaña que canjea un código usa su sessionStorage', () => {
    const tab = memory()
    const selected = chooseTabStorage({ pathname: ENTRY, base: '/', local: memory(), tab })
    expect(selected).toEqual({ kind: 'preview', storage: tab, sessionKey: PREVIEW_SESSION_KEY })
  })

  it('una pestaña marcada sigue siendo de vista previa al recargar en otra ruta', () => {
    const tab = memory({ [PREVIEW_TAB_KEY]: '1' })
    expect(chooseTabStorage({ pathname: '/tablero', base: '/', local: memory(), tab }).kind).toBe('preview')
  })

  it('sin sessionStorage la vista previa vive en memoria y nunca cae en localStorage', () => {
    const selected = chooseTabStorage({ pathname: ENTRY, base: '/', local: memory(), tab: null })
    expect(selected).toEqual({ kind: 'preview', storage: null, sessionKey: PREVIEW_SESSION_KEY })
  })

  it('si leer la marca falla, la pestaña es normal', () => {
    const broken: KeyValueStorage = {
      ...memory(),
      getItem: () => {
        throw new Error('bloqueado')
      },
    }
    expect(chooseTabStorage({ pathname: '/', base: '/', local: memory(), tab: broken }).kind).toBe('restaurant')
  })
})

function pageIn(url: string) {
  const { pathname, search, hash } = new URL(url, 'http://localhost')
  return { location: { pathname, search, hash }, history: { state: { idx: 0 }, replaceState: jest.fn() } }
}

describe('captureEntryFragment', () => {
  it('en la ruta de canje saca el fragmento de la barra y deja la ruta de la aplicación', () => {
    const page = pageIn('/Vista-Previa/?a=1#codigo=abc')

    expect(captureEntryFragment(page, '/')).toBe(FRAGMENT)
    expect(page.history.replaceState).toHaveBeenCalledTimes(1)
    expect(page.history.replaceState).toHaveBeenCalledWith({ idx: 0 }, '', '/vista-previa?a=1')
  })

  it('con base, la respeta', () => {
    const page = pageIn('/app/vista%2Dprevia#codigo=abc')
    expect(captureEntryFragment(page, '/app/')).toBe(FRAGMENT)
    expect(page.history.replaceState).toHaveBeenCalledWith({ idx: 0 }, '', ENTRY_WITH_BASE)
  })

  it('en otra ruta no toca nada', () => {
    const page = pageIn('/pedidos#codigo=abc')
    expect(captureEntryFragment(page, '/')).toBeNull()
    expect(page.history.replaceState).not.toHaveBeenCalled()
  })

  it('si no se puede reescribir el historial, igual devuelve el fragmento', () => {
    const page = pageIn('/vista-previa#codigo=abc')
    page.history.replaceState.mockImplementation(() => {
      throw new Error('bloqueado')
    })
    expect(captureEntryFragment(page, '/')).toBe(FRAGMENT)
  })
})

describe('takeEntryFragment', () => {
  afterEach(() => {
    unstubAllGlobals()
  })

  it('al cargar la página ya sacó el código de la barra, y lo entrega una sola vez', async () => {
    const page = pageIn('/vista-previa#codigo=abc')
    stubGlobal('location', page.location)
    stubGlobal('history', page.history)
    jest.resetModules()

    // Solo cargar el módulo, sin router ni pantalla de canje.
    const { takeEntryFragment } = await import('./tabStorage')

    expect(page.history.replaceState).toHaveBeenCalledWith({ idx: 0 }, '', '/vista-previa')
    expect(takeEntryFragment()).toBe(FRAGMENT)
    expect(takeEntryFragment()).toBeNull()
  })
})
