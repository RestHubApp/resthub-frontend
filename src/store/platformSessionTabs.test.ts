/**
 * @jest-environment ./jest/nodeEnvironment.cjs
 */
// La sesión del administrador del sistema en varias pestañas del mismo
// navegador: cada una carga su propio almacén sobre el mismo `localStorage`.
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals'
import { unstubAllGlobals } from '#jest/globals'
import { type AlmacenDePrueba, avisar, fakeStorage, guardado, nuevaPestana, tokenQueVence } from '#jest/pestanas'

import type { CurrentUserResponse, PlatformAdmin } from '@/api/types'

const SECRET_PLATFORM = 'resthub.platform-session.v1'

function admin(id: number): PlatformAdmin {
  return { id, email: `admin${String(id)}@resthub.dev`, full_name: `Admin ${String(id)}` }
}

function account(userId: number): CurrentUserResponse {
  return { user: { id: userId }, restaurant: { id: 1 }, permissions: [] } as unknown as CurrentUserResponse
}

async function openTab(local: AlmacenDePrueba) {
  const { ventana: window } = nuevaPestana(local)
  const { useSession } = await import('./session')
  const { usePlatformSession } = await import('./platformSession')
  return { ventana: window, useSession, usePlatformSession }
}

beforeEach(() => {
  jest.useFakeTimers()
})

afterEach(() => {
  jest.useRealTimers()
  unstubAllGlobals()
})

describe('sesión de plataforma entre pestañas', () => {
  it('cerrar sesión en una pestaña la cierra en las demás', async () => {
    const local = fakeStorage()
    const one = await openTab(local)
    one.usePlatformSession.getState().signIn(tokenQueVence(3600), admin(1))
    const two = await openTab(local)
    expect(two.usePlatformSession.getState().admin).toEqual(admin(1))

    one.usePlatformSession.getState().signOut()
    avisar(two.ventana, local, SECRET_PLATFORM)

    expect(two.usePlatformSession.getState()).toMatchObject({ token: null, admin: null, expired: false })
  })

  it('una pestaña que no se enteró no pisa al otro administrador al renovar ni al releer', async () => {
    const local = fakeStorage()
    const tokenA = tokenQueVence(3600, 'a')
    const one = await openTab(local)
    one.usePlatformSession.getState().signIn(tokenA, admin(1))
    const two = await openTab(local)
    const three = await openTab(local)

    one.usePlatformSession.getState().signOut()
    const tokenB = tokenQueVence(3600, 'b')
    one.usePlatformSession.getState().signIn(tokenB, admin(2))
    two.usePlatformSession.getState().renew(tokenA, tokenQueVence(7200, 'a2'), admin(1))
    three.usePlatformSession.getState().refresh(admin(1))

    expect(guardado(local, SECRET_PLATFORM)).toEqual({ token: tokenB, admin: admin(2) })
    expect(two.usePlatformSession.getState().token).toBeNull()
    expect(three.usePlatformSession.getState().token).toBeNull()
  })

  it('adopta el token que renovó otra pestaña del mismo administrador', async () => {
    const local = fakeStorage()
    const old = tokenQueVence(3600, 'a')
    const one = await openTab(local)
    one.usePlatformSession.getState().signIn(old, admin(1))
    const two = await openTab(local)
    const fresh = tokenQueVence(7200, 'a2')

    one.usePlatformSession.getState().renew(old, fresh, admin(1))
    avisar(two.ventana, local, SECRET_PLATFORM)

    expect(two.usePlatformSession.getState()).toMatchObject({ token: fresh, admin: admin(1) })
  })

  it('la sesión de restaurante no se cierra por un cambio en la de plataforma', async () => {
    const local = fakeStorage()
    const token = tokenQueVence(3600)
    const one = await openTab(local)
    one.useSession.getState().signIn(token, account(1))
    one.usePlatformSession.getState().signIn(tokenQueVence(3600, 'p'), admin(1))
    const two = await openTab(local)

    one.usePlatformSession.getState().signOut()
    avisar(two.ventana, local, SECRET_PLATFORM)

    expect(two.useSession.getState().token).toBe(token)
    expect(two.usePlatformSession.getState().token).toBeNull()
  })
})
