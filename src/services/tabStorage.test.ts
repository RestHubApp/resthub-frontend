import { afterEach, describe, expect, it, vi } from 'vitest'

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

const ENTRADA = '/vista-previa'
const ENTRADA_CON_BASE = '/app/vista-previa'
const FRAGMENTO = '#codigo=abc'

function memoria(inicial: Record<string, string> = {}): KeyValueStorage {
  const datos = new Map(Object.entries(inicial))
  return {
    getItem: (clave) => datos.get(clave) ?? null,
    setItem: (clave, valor) => {
      datos.set(clave, valor)
    },
    removeItem: (clave) => {
      datos.delete(clave)
    },
  }
}

describe('isPreviewEntry', () => {
  it('reconoce la ruta de canje, con o sin barra final', () => {
    expect(isPreviewEntry(ENTRADA, '/')).toBe(true)
    expect(isPreviewEntry('/vista-previa/', '/')).toBe(true)
  })

  it('respeta la base de la aplicación, como el router', () => {
    expect(isPreviewEntry(ENTRADA_CON_BASE, '/app/')).toBe(true)
    expect(isPreviewEntry('/APP/vista-previa', '/app/')).toBe(true)
    expect(isPreviewEntry('/app/pedidos', '/app/')).toBe(false)
    // Fuera de la base el router no muestra ninguna ruta.
    expect(isPreviewEntry(ENTRADA, '/app/')).toBe(false)
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
      expect(chooseTabStorage({ pathname: url, base, local: memoria(), tab: memoria() }).kind).toBe('preview')
    }
    expect(previewEntryUrl('/app/')).toBe(ENTRADA_CON_BASE)
  })
})

describe('chooseTabStorage', () => {
  it('una pestaña cargada en la ruta de canje escrita en mayúsculas es de vista previa', () => {
    expect(chooseTabStorage({ pathname: '/Vista-Previa', base: '/', local: memoria(), tab: memoria() }).kind).toBe(
      'preview',
    )
  })

  it('una pestaña normal usa localStorage y la clave de siempre', () => {
    const local = memoria()
    const elegido = chooseTabStorage({ pathname: '/pedidos', base: '/', local, tab: memoria() })
    expect(elegido).toEqual({ kind: 'restaurant', storage: local, sessionKey: RESTAURANT_SESSION_KEY })
  })

  it('la pestaña que canjea un código usa su sessionStorage', () => {
    const tab = memoria()
    const elegido = chooseTabStorage({ pathname: ENTRADA, base: '/', local: memoria(), tab })
    expect(elegido).toEqual({ kind: 'preview', storage: tab, sessionKey: PREVIEW_SESSION_KEY })
  })

  it('una pestaña marcada sigue siendo de vista previa al recargar en otra ruta', () => {
    const tab = memoria({ [PREVIEW_TAB_KEY]: '1' })
    expect(chooseTabStorage({ pathname: '/tablero', base: '/', local: memoria(), tab }).kind).toBe('preview')
  })

  it('sin sessionStorage la vista previa vive en memoria y nunca cae en localStorage', () => {
    const elegido = chooseTabStorage({ pathname: ENTRADA, base: '/', local: memoria(), tab: null })
    expect(elegido).toEqual({ kind: 'preview', storage: null, sessionKey: PREVIEW_SESSION_KEY })
  })

  it('si leer la marca falla, la pestaña es normal', () => {
    const rota: KeyValueStorage = {
      ...memoria(),
      getItem: () => {
        throw new Error('bloqueado')
      },
    }
    expect(chooseTabStorage({ pathname: '/', base: '/', local: memoria(), tab: rota }).kind).toBe('restaurant')
  })
})

function paginaEn(url: string) {
  const { pathname, search, hash } = new URL(url, 'http://localhost')
  return { location: { pathname, search, hash }, history: { state: { idx: 0 }, replaceState: vi.fn() } }
}

describe('captureEntryFragment', () => {
  it('en la ruta de canje saca el fragmento de la barra y deja la ruta de la aplicación', () => {
    const pagina = paginaEn('/Vista-Previa/?a=1#codigo=abc')

    expect(captureEntryFragment(pagina, '/')).toBe(FRAGMENTO)
    expect(pagina.history.replaceState).toHaveBeenCalledExactlyOnceWith({ idx: 0 }, '', '/vista-previa?a=1')
  })

  it('con base, la respeta', () => {
    const pagina = paginaEn('/app/vista%2Dprevia#codigo=abc')
    expect(captureEntryFragment(pagina, '/app/')).toBe(FRAGMENTO)
    expect(pagina.history.replaceState).toHaveBeenCalledWith({ idx: 0 }, '', ENTRADA_CON_BASE)
  })

  it('en otra ruta no toca nada', () => {
    const pagina = paginaEn('/pedidos#codigo=abc')
    expect(captureEntryFragment(pagina, '/')).toBeNull()
    expect(pagina.history.replaceState).not.toHaveBeenCalled()
  })

  it('si no se puede reescribir el historial, igual devuelve el fragmento', () => {
    const pagina = paginaEn('/vista-previa#codigo=abc')
    pagina.history.replaceState.mockImplementation(() => {
      throw new Error('bloqueado')
    })
    expect(captureEntryFragment(pagina, '/')).toBe(FRAGMENTO)
  })
})

describe('takeEntryFragment', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('al cargar la página ya sacó el código de la barra, y lo entrega una sola vez', async () => {
    const pagina = paginaEn('/vista-previa#codigo=abc')
    vi.stubGlobal('location', pagina.location)
    vi.stubGlobal('history', pagina.history)
    vi.resetModules()

    // Solo cargar el módulo, sin router ni pantalla de canje.
    const { takeEntryFragment } = await import('./tabStorage')

    expect(pagina.history.replaceState).toHaveBeenCalledWith({ idx: 0 }, '', '/vista-previa')
    expect(takeEntryFragment()).toBe(FRAGMENTO)
    expect(takeEntryFragment()).toBeNull()
  })
})
