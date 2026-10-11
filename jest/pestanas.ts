// Varias pestañas del mismo navegador para las pruebas de las sesiones: cada
// pestaña tiene su `window` y su `sessionStorage`, y todas comparten el
// `localStorage` del navegador. Las pruebas corren en el entorno de Node.
import { jest } from '@jest/globals'

import { stubGlobal } from './globals'

export function tokenQueVence(segundosDesdeAhora: number, sello = ''): string {
  const exp = Math.floor(Date.now() / 1000) + segundosDesdeAhora
  return `cabecera.${btoa(JSON.stringify({ exp, sello }))}.firma`
}

export interface AlmacenDePrueba {
  getItem: (clave: string) => string | null
  setItem: (clave: string, valor: string) => void
  removeItem: (clave: string) => void
  readonly datos: Map<string, string>
}

export function fakeStorage(): AlmacenDePrueba {
  const datos = new Map<string, string>()
  return {
    getItem: (clave) => datos.get(clave) ?? null,
    setItem: (clave, valor) => {
      datos.set(clave, valor)
    },
    removeItem: (clave) => {
      datos.delete(clave)
    },
    datos,
  }
}

/**
 * Prepara una pestaña nueva: su `window`, su `sessionStorage`, la ruta con que
 * se cargó y módulos recién cargados. Lo que la prueba importe después es de
 * esta pestaña.
 */
export function nuevaPestana(local: AlmacenDePrueba, ruta = '/', pestana: AlmacenDePrueba = fakeStorage()) {
  const ventana = new EventTarget()
  stubGlobal('window', ventana)
  stubGlobal('localStorage', local)
  stubGlobal('sessionStorage', pestana)
  stubGlobal('location', { pathname: ruta })
  jest.resetModules()
  return { ventana, pestana }
}

/**
 * El aviso `storage` que el navegador entrega a las demás pestañas del mismo
 * origen cuando una cambia `localStorage`; la que lo cambió no lo recibe.
 */
export function avisar(ventana: EventTarget, storageArea: unknown, key: string | null): void {
  ventana.dispatchEvent(Object.assign(new Event('storage'), { key, storageArea }))
}

/** Lo guardado en `localStorage` bajo esa clave, ya leído. */
export function guardado(local: AlmacenDePrueba, clave: string): unknown {
  const raw = local.datos.get(clave)
  return raw === undefined ? null : JSON.parse(raw)
}
