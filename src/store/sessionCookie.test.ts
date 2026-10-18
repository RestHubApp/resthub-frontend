/**
 * @jest-environment ./jest/nodeEnvironment.cjs
 */
// La sesión con el token solo en memoria y la cookie del API como respaldo (S2).
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals'
import { unstubAllGlobals } from '#jest/globals'
import { fakeStorage, newTab, readSaved, tokenThatExpires, type TestStorage } from '#jest/tabs'

import type { StaffSession } from '@/api/types'

const STORAGE_KEY = 'resthub.session.v3'

const ACCOUNT = {
  kind: 'staff',
  user: { id: 1, role_id: 1 },
  restaurant: { id: 1, timezone: 'America/Lima' },
  permissions: [],
  preview: false,
} as unknown as StaffSession

function expiryOf(token: string): number {
  return (JSON.parse(atob(token.split('.')[1] ?? '')) as { exp: number }).exp * 1000
}

async function openTab(local: TestStorage) {
  newTab(local)
  const { useSession } = await import('./session')
  const { expireSession, hasCookieSession } = await import('@/services/apiCredentials')
  return { useSession, expireSession, hasCookieSession }
}

beforeEach(() => {
  jest.useFakeTimers()
})

afterEach(() => {
  jest.useRealTimers()
  unstubAllGlobals()
})

describe('token en memoria y sesión en la cookie', () => {
  it('no lee una sesión guardada con la forma vieja (con el token) y la borra', async () => {
    const local = fakeStorage()
    local.data.set('resthub.session.v2', JSON.stringify({ token: tokenThatExpires(3600), account: ACCOUNT }))
    const { useSession, hasCookieSession } = await openTab(local)
    expect(useSession.getState()).toMatchObject({ token: null, account: null })
    expect(hasCookieSession()).toBe(false)
    expect(local.data.size).toBe(0)
  })

  it('recupera el token de la cookie con la misma marca guardada', async () => {
    const local = fakeStorage()
    local.data.set(STORAGE_KEY, JSON.stringify({ tag: 'marca-1', expiresAt: expiryOf(tokenThatExpires(60)), account: ACCOUNT }))
    const { useSession, hasCookieSession } = await openTab(local)
    expect(useSession.getState()).toMatchObject({ token: null, account: ACCOUNT, expired: false })
    expect(hasCookieSession()).toBe(true)
    const token = tokenThatExpires(3600)

    useSession.getState().renew(null, token, ACCOUNT)

    expect(useSession.getState().token).toBe(token)
    expect(readSaved(local, STORAGE_KEY)).toEqual({ tag: 'marca-1', expiresAt: expiryOf(token), account: ACCOUNT })
  })

  it('un 401 con el token de la pestaña lo suelta; otro sin token cierra la sesión', async () => {
    const local = fakeStorage()
    const { useSession, expireSession } = await openTab(local)
    const token = tokenThatExpires(3600)
    useSession.getState().signIn(token, ACCOUNT)

    expireSession('un-token-anterior')
    expect(useSession.getState().token).toBe(token)

    expireSession(token)
    expect(useSession.getState()).toMatchObject({ token: null, account: ACCOUNT, expired: false })

    expireSession(null)
    expect(useSession.getState()).toMatchObject({ token: null, account: null, expired: true })
    expect(local.data.has(STORAGE_KEY)).toBe(false)
  })
})
