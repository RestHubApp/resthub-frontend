// Varias pestañas del mismo navegador para las pruebas de las sesiones: cada
// pestaña tiene su `window` y su `sessionStorage`, y todas comparten el
// `localStorage` del navegador. Las pruebas corren en el entorno de Node.
import { jest } from '@jest/globals'

import { stubGlobal } from './globals'

export function tokenThatExpires(secondsFromNow: number, stamp = ''): string {
  const exp = Math.floor(Date.now() / 1000) + secondsFromNow
  return `cabecera.${btoa(JSON.stringify({ exp, stamp }))}.firma`
}

export interface TestStorage {
  getItem: (key: string) => string | null
  setItem: (key: string, value: string) => void
  removeItem: (key: string) => void
  readonly data: Map<string, string>
}

export function fakeStorage(): TestStorage {
  const data = new Map<string, string>()
  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => {
      data.set(key, value)
    },
    removeItem: (key) => {
      data.delete(key)
    },
    data,
  }
}

/**
 * Prepara una pestaña nueva: su `window`, su `sessionStorage`, la ruta con que
 * se cargó y módulos recién cargados. Lo que la prueba importe después es de
 * esta pestaña.
 */
export function newTab(local: TestStorage, route = '/', tab: TestStorage = fakeStorage()) {
  const window = new EventTarget()
  stubGlobal('window', window)
  stubGlobal('localStorage', local)
  stubGlobal('sessionStorage', tab)
  stubGlobal('location', { pathname: route })
  jest.resetModules()
  return { window, tab }
}

/**
 * El aviso `storage` que el navegador entrega a las demás pestañas del mismo
 * origen cuando una cambia `localStorage`; la que lo cambió no lo recibe.
 */
export function notify(window: EventTarget, storageArea: unknown, key: string | null): void {
  window.dispatchEvent(Object.assign(new Event('storage'), { key, storageArea }))
}

/** Lo guardado en `localStorage` bajo esa clave, ya leído. */
export function readSaved(local: TestStorage, key: string): unknown {
  const raw = local.data.get(key)
  return raw === undefined ? null : JSON.parse(raw)
}
