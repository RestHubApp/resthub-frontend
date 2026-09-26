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
