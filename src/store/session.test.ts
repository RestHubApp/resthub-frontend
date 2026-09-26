import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { CurrentUserResponse } from '../api/types'

const CLAVE = 'resthub.session.v2'

function tokenQueVence(segundosDesdeAhora: number): string {
  const exp = Math.floor(Date.now() / 1000) + segundosDesdeAhora
  return `cabecera.${btoa(JSON.stringify({ exp }))}.firma`
}

// Solo lo que el almacén lee de la cuenta.
function cuenta(userId: number): CurrentUserResponse {
  return {
    user: { id: userId, role_id: 1 },
    restaurant: { id: 1, timezone: 'America/Lima' },
    permissions: [],
  } as unknown as CurrentUserResponse
}

function fakeStorage() {
  const datos = new Map<string, string>()
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

// El almacén lee lo guardado al cargarse: cada prueba parte de módulos nuevos.
async function cargar() {
  const storage = fakeStorage()
  vi.stubGlobal('localStorage', storage)
  vi.resetModules()
  const { useSession } = await import('./session')
  return { storage, useSession }
}

function guardado(storage: ReturnType<typeof fakeStorage>): unknown {
  return JSON.parse(storage.datos.get(CLAVE) ?? 'null')
}

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('renovación de la sesión del restaurante', () => {
  it('cambia el token de la sesión que pidió la renovación', async () => {
    const { storage, useSession } = await cargar()
    const viejo = tokenQueVence(3600)
    const nuevo = tokenQueVence(7200)
    useSession.getState().signIn(viejo, cuenta(1))

    useSession.getState().renew(viejo, nuevo, cuenta(1))

    expect(useSession.getState().token).toBe(nuevo)
    expect(guardado(storage)).toEqual({ token: nuevo, account: cuenta(1) })
  })

  it('descarta la respuesta si mientras viajaba entró otra cuenta', async () => {
    const { storage, useSession } = await cargar()
    const viejo = tokenQueVence(3600)
    const otra = tokenQueVence(3500)
    useSession.getState().signIn(viejo, cuenta(1))
    useSession.getState().signOut()
    useSession.getState().signIn(otra, cuenta(2))

    useSession.getState().renew(viejo, tokenQueVence(7200), cuenta(1))

    expect(useSession.getState()).toMatchObject({ token: otra, account: cuenta(2) })
    expect(guardado(storage)).toEqual({ token: otra, account: cuenta(2) })
  })

  it('no revive una sesión que se cerró mientras viajaba', async () => {
    const { storage, useSession } = await cargar()
    const viejo = tokenQueVence(3600)
    useSession.getState().signIn(viejo, cuenta(1))
    useSession.getState().signOut()

    useSession.getState().renew(viejo, tokenQueVence(7200), cuenta(1))

    expect(useSession.getState().token).toBeNull()
    expect(storage.datos.has(CLAVE)).toBe(false)
  })
})

const MARCA = 'resthub.vista-previa.pestana.v1'
const PREVIA = 'resthub.vista-previa.sesion.v1'

function cuentaDeMuestra(): CurrentUserResponse {
  return { ...cuenta(9), preview: true }
}

// Una pestaña recién abierta en `/vista-previa`, con una sesión real en localStorage.
async function pestanaDeVistaPrevia(ruta = '/vista-previa', inicial: Record<string, string> = {}) {
  const local = fakeStorage()
  local.datos.set(CLAVE, JSON.stringify({ token: tokenQueVence(3600), account: cuenta(1) }))
  const pestana = fakeStorage()
  for (const [clave, valor] of Object.entries(inicial)) {
    pestana.datos.set(clave, valor)
  }
  vi.stubGlobal('localStorage', local)
  vi.stubGlobal('sessionStorage', pestana)
  vi.stubGlobal('location', { pathname: ruta })
  vi.resetModules()
  const { useSession } = await import('./session')
  return { local, pestana, useSession }
}

describe('sesión de vista previa', () => {
  it('no lee la sesión real del navegador', async () => {
    const { useSession } = await pestanaDeVistaPrevia()
    expect(useSession.getState().token).toBeNull()
  })

  it('se guarda en la pestaña y deja intacta la sesión real', async () => {
    const { local, pestana, useSession } = await pestanaDeVistaPrevia()
    const real = local.datos.get(CLAVE)
    const token = tokenQueVence(1800)

    useSession.getState().startPreview(token, cuentaDeMuestra())

    expect(local.datos.get(CLAVE)).toBe(real)
    expect(JSON.parse(pestana.datos.get(PREVIA) ?? 'null')).toEqual({ token, account: cuentaDeMuestra() })
    expect(pestana.datos.get(MARCA)).toBe('1')
  })

  it('rechaza una sesión que el servidor no marcó como vista previa', async () => {
    const { useSession } = await pestanaDeVistaPrevia()
    expect(() => {
      useSession.getState().startPreview(tokenQueVence(1800), { ...cuenta(9), preview: false })
    }).toThrow()
    expect(useSession.getState().token).toBeNull()
  })

  it('en una pestaña normal no se abre', async () => {
    const { storage, useSession } = await cargar()
    expect(() => {
      useSession.getState().startPreview(tokenQueVence(1800), cuentaDeMuestra())
    }).toThrow()
    expect(storage.datos.size).toBe(0)
  })

  it('al recargar la pestaña vuelve la vista previa, no la sesión real', async () => {
    const token = tokenQueVence(1800)
    const { useSession } = await pestanaDeVistaPrevia('/pedidos', {
      [MARCA]: '1',
      [PREVIA]: JSON.stringify({ token, account: cuentaDeMuestra() }),
    })
    expect(useSession.getState().token).toBe(token)
  })

  it('al vencer se borra su sesión pero la pestaña sigue siendo de vista previa', async () => {
    const { local, pestana, useSession } = await pestanaDeVistaPrevia()
    const real = local.datos.get(CLAVE)
    useSession.getState().startPreview(tokenQueVence(1800), cuentaDeMuestra())

    useSession.getState().expire()

    expect(pestana.datos.has(PREVIA)).toBe(false)
    expect(pestana.datos.get(MARCA)).toBe('1')
    expect(local.datos.get(CLAVE)).toBe(real)
  })

  it('salir borra la sesión y la marca, y no toca localStorage', async () => {
    const { local, pestana, useSession } = await pestanaDeVistaPrevia()
    const real = local.datos.get(CLAVE)
    useSession.getState().startPreview(tokenQueVence(1800), cuentaDeMuestra())

    useSession.getState().exitPreview()

    expect(pestana.datos.size).toBe(0)
    expect(local.datos.get(CLAVE)).toBe(real)
    expect(useSession.getState()).toMatchObject({ token: null, account: null, expired: false })
  })

  it('salir de la vista previa en una pestaña normal no cierra la sesión', async () => {
    const { storage, useSession } = await cargar()
    const token = tokenQueVence(3600)
    useSession.getState().signIn(token, cuenta(1))

    useSession.getState().exitPreview()

    expect(useSession.getState().token).toBe(token)
    expect(guardado(storage)).toEqual({ token, account: cuenta(1) })
  })
})
