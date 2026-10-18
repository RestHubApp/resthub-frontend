/**
 * @jest-environment ./jest/nodeEnvironment.cjs
 */
// La sesión es una sola y lleva `kind`: del personal de un restaurante o de la
// administración del sistema. Simula una pestaña sin DOM, como `session.test.ts`.
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals'
import { stubGlobal, unstubAllGlobals } from '#jest/globals'

import type { PlatformSession } from '@/api/types'

const STORAGE_KEY = 'resthub.session.v3'

function tokenThatExpires(secondsFromNow: number): string {
  const exp = Math.floor(Date.now() / 1000) + secondsFromNow
  return `cabecera.${btoa(JSON.stringify({ exp }))}.firma`
}

// Solo lo que el almacén lee de la cuenta de plataforma.
function platformAccount(adminId: number): PlatformSession {
  return {
    kind: 'platform',
    admin: { id: adminId, email: 'plataforma@resthub.dev', full_name: 'Equipo RestHub' },
    permissions: ['platform.restaurants.read'],
    preview: false,
  }
}

function fakeStorage() {
  const data = new Map<string, string>()
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => {
      data.set(key, value)
    },
    removeItem: (key: string) => {
      data.delete(key)
    },
    data,
  }
}

// El almacén lee lo guardado al cargarse: cada prueba parte de módulos nuevos.
async function load() {
  const storage = fakeStorage()
  stubGlobal('localStorage', storage)
  jest.resetModules()
  const { useSession } = await import('./session')
  return { storage, useSession }
}

function saved(storage: ReturnType<typeof fakeStorage>): unknown {
  return JSON.parse(storage.data.get(STORAGE_KEY) ?? 'null')
}

beforeEach(() => {
  jest.useFakeTimers()
})

afterEach(() => {
  jest.useRealTimers()
  unstubAllGlobals()
})

describe('sesión única: del personal o de plataforma', () => {
  it('guarda y restaura la sesión de plataforma en la misma clave que la del personal', async () => {
    const { storage, useSession } = await load()
    const token = tokenThatExpires(3600)
    useSession.getState().signIn(token, platformAccount(1))
    expect(saved(storage)).toEqual({ tag: expect.any(String), expiresAt: expect.any(Number), account: platformAccount(1) })

    const again = fakeStorage()
    again.data.set(STORAGE_KEY, JSON.stringify(saved(storage)))
    stubGlobal('localStorage', again)
    jest.resetModules()
    const reloaded = await import('./session')
    expect(reloaded.useSession.getState().account).toEqual(platformAccount(1))
    expect(reloaded.staffOf(reloaded.useSession.getState().account)).toBeNull()
  })

  it('una sesión guardada antes de `kind` se lee como del personal', async () => {
    const storage = fakeStorage()
    const old = { user: { id: 3, role_id: 1 }, restaurant: { id: 1, timezone: 'America/Lima' }, permissions: [], preview: false }
    storage.data.set(STORAGE_KEY, JSON.stringify({ tag: 'marca', expiresAt: Date.now() + 3_600_000, account: old }))
    stubGlobal('localStorage', storage)
    jest.resetModules()
    const { useSession } = await import('./session')
    expect(useSession.getState().account).toMatchObject({ kind: 'staff', user: { id: 3 } })
  })

  it('olvida lo que dejó la sesión de plataforma aparte, la de antes de esta versión', async () => {
    const storage = fakeStorage()
    storage.data.set('resthub.platform-session.v1', JSON.stringify({ token: 'x', admin: { id: 1 } }))
    stubGlobal('localStorage', storage)
    jest.resetModules()
    await import('./session')
    expect(storage.data.has('resthub.platform-session.v1')).toBe(false)
  })

  it('cerrar la sesión de plataforma vacía el caché entero', async () => {
    const { useSession } = await load()
    const { queryClient } = await import('@/services/queryClient')
    useSession.getState().signIn(tokenThatExpires(3600), platformAccount(1))
    queryClient.setQueryData(['platform', 'restaurants'], ['de plataforma'])
    useSession.getState().signOut()
    expect(queryClient.getQueryData(['platform', 'restaurants'])).toBeUndefined()
  })

  it('el permiso de plataforma lo da la sesión y el del restaurante no', async () => {
    const { useSession } = await load()
    const { hasPermission } = await import('./session')
    useSession.getState().signIn(tokenThatExpires(3600), platformAccount(1))
    const { account } = useSession.getState()
    expect(hasPermission(account, 'platform.restaurants.read')).toBe(true)
    expect(hasPermission(account, 'platform.activity.read')).toBe(false)
    expect(hasPermission(account, 'orders.take')).toBe(false)
  })
})
