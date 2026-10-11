/**
 * @jest-environment ./jest/nodeEnvironment.cjs
 */
// La sesión del administrador del sistema en varias pestañas del mismo
// navegador: cada una carga su propio almacén sobre el mismo `localStorage`.
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals'
import { unstubAllGlobals } from '#jest/globals'
import { type AlmacenDePrueba, avisar, fakeStorage, guardado, nuevaPestana, tokenQueVence } from '#jest/pestanas'

import type { CurrentUserResponse, PlatformAdmin } from '../api/types'

const CLAVE_PLATAFORMA = 'resthub.platform-session.v1'

function admin(id: number): PlatformAdmin {
  return { id, email: `admin${String(id)}@resthub.dev`, full_name: `Admin ${String(id)}` }
}

function cuenta(userId: number): CurrentUserResponse {
  return { user: { id: userId }, restaurant: { id: 1 }, permissions: [] } as unknown as CurrentUserResponse
}

async function abrirPestana(local: AlmacenDePrueba) {
  const { ventana } = nuevaPestana(local)
  const { useSession } = await import('./session')
  const { usePlatformSession } = await import('./platformSession')
  return { ventana, useSession, usePlatformSession }
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
    const uno = await abrirPestana(local)
    uno.usePlatformSession.getState().signIn(tokenQueVence(3600), admin(1))
    const dos = await abrirPestana(local)
    expect(dos.usePlatformSession.getState().admin).toEqual(admin(1))

    uno.usePlatformSession.getState().signOut()
    avisar(dos.ventana, local, CLAVE_PLATAFORMA)

    expect(dos.usePlatformSession.getState()).toMatchObject({ token: null, admin: null, expired: false })
  })

  it('una pestaña que no se enteró no pisa al otro administrador al renovar ni al releer', async () => {
    const local = fakeStorage()
    const tokenA = tokenQueVence(3600, 'a')
    const uno = await abrirPestana(local)
    uno.usePlatformSession.getState().signIn(tokenA, admin(1))
    const dos = await abrirPestana(local)
    const tres = await abrirPestana(local)

    uno.usePlatformSession.getState().signOut()
    const tokenB = tokenQueVence(3600, 'b')
    uno.usePlatformSession.getState().signIn(tokenB, admin(2))
    dos.usePlatformSession.getState().renew(tokenA, tokenQueVence(7200, 'a2'), admin(1))
    tres.usePlatformSession.getState().refresh(admin(1))

    expect(guardado(local, CLAVE_PLATAFORMA)).toEqual({ token: tokenB, admin: admin(2) })
    expect(dos.usePlatformSession.getState().token).toBeNull()
    expect(tres.usePlatformSession.getState().token).toBeNull()
  })

  it('adopta el token que renovó otra pestaña del mismo administrador', async () => {
    const local = fakeStorage()
    const viejo = tokenQueVence(3600, 'a')
    const uno = await abrirPestana(local)
    uno.usePlatformSession.getState().signIn(viejo, admin(1))
    const dos = await abrirPestana(local)
    const nuevo = tokenQueVence(7200, 'a2')

    uno.usePlatformSession.getState().renew(viejo, nuevo, admin(1))
    avisar(dos.ventana, local, CLAVE_PLATAFORMA)

    expect(dos.usePlatformSession.getState()).toMatchObject({ token: nuevo, admin: admin(1) })
  })

  it('la sesión de restaurante no se cierra por un cambio en la de plataforma', async () => {
    const local = fakeStorage()
    const token = tokenQueVence(3600)
    const uno = await abrirPestana(local)
    uno.useSession.getState().signIn(token, cuenta(1))
    uno.usePlatformSession.getState().signIn(tokenQueVence(3600, 'p'), admin(1))
    const dos = await abrirPestana(local)

    uno.usePlatformSession.getState().signOut()
    avisar(dos.ventana, local, CLAVE_PLATAFORMA)

    expect(dos.useSession.getState().token).toBe(token)
    expect(dos.usePlatformSession.getState().token).toBeNull()
  })
})
