import { describe, expect, it } from 'vitest'

import {
  chooseTabStorage,
  isPreviewEntry,
  PREVIEW_SESSION_KEY,
  PREVIEW_TAB_KEY,
  RESTAURANT_SESSION_KEY,
  type KeyValueStorage,
} from './tabStorage'

const ENTRADA = '/vista-previa'

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

  it('respeta la base de la aplicación', () => {
    expect(isPreviewEntry('/app/vista-previa', '/app/')).toBe(true)
    expect(isPreviewEntry(ENTRADA, '/app/')).toBe(true)
    expect(isPreviewEntry('/app/pedidos', '/app/')).toBe(false)
  })

  it('no confunde otras rutas', () => {
    expect(isPreviewEntry('/', '/')).toBe(false)
    expect(isPreviewEntry('/vista-previa-x', '/')).toBe(false)
    expect(isPreviewEntry('/plataforma/vista-previa', '/')).toBe(false)
  })
})

describe('chooseTabStorage', () => {
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
