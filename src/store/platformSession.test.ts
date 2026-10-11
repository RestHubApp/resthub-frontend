/**
 * @jest-environment ./jest/nodeEnvironment.cjs
 */
// Simula una pestaña sin DOM (location, window y almacenamiento de prueba),
// como corría con Vitest: en jsdom, `window.location` no se puede reemplazar.
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals'
import { HttpResponse, http } from 'msw'

import { stubGlobal, unstubAllGlobals } from '#jest/globals'
import { mswServer } from '#jest/mswServer'

const PLATFORM_STORAGE_KEY = 'resthub.platform-session.v1'
const RESTAURANT_STORAGE_KEY = 'resthub.session.v2'
const ADMIN = { id: 1, full_name: 'Equipo RestHub', email: 'plataforma@resthub.dev' }

function tokenThatExpires(secondsFromNow: number): string {
  const exp = Math.floor(Date.now() / 1000) + secondsFromNow
  return `cabecera.${btoa(JSON.stringify({ exp, scope: 'platform' }))}.firma`
}

function fakeStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial))
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
async function load(initial: Record<string, string> = {}) {
  const storage = fakeStorage(initial)
  stubGlobal('localStorage', storage)
  jest.resetModules()
  const { usePlatformSession } = await import('./platformSession')
  const { setAuthToken } = await import('@/services/apiCredentials')
  const { fetchTables } = await import('@/api/tables')
  const { renewPlatformSession } = await import('@/api/platform')
  const { queryClient } = await import('@/services/queryClient')
  return { storage, usePlatformSession, fetchTables, renewPlatformSession, setAuthToken, queryClient }
}

beforeEach(() => {
  jest.useFakeTimers()
})

afterEach(() => {
  jest.useRealTimers()
  unstubAllGlobals()
})

describe('sesión de plataforma', () => {
  it('se guarda en su propia clave y no toca la del restaurante', async () => {
    const restaurant = JSON.stringify({ token: 'r', account: {} })
    const { storage, usePlatformSession } = await load({ [RESTAURANT_STORAGE_KEY]: restaurant })
    const token = tokenThatExpires(3600)

    usePlatformSession.getState().signIn(token, ADMIN)

    expect(JSON.parse(storage.data.get(PLATFORM_STORAGE_KEY) ?? '{}')).toEqual({ token, admin: ADMIN })
    expect(storage.data.get(RESTAURANT_STORAGE_KEY)).toBe(restaurant)

    usePlatformSession.getState().signOut()
    expect(storage.data.has(PLATFORM_STORAGE_KEY)).toBe(false)
    expect(storage.data.get(RESTAURANT_STORAGE_KEY)).toBe(restaurant)
  })

  it('recupera una sesión guardada vigente y descarta una vencida', async () => {
    const current = tokenThatExpires(3600)
    const open = await load({ [PLATFORM_STORAGE_KEY]: JSON.stringify({ token: current, admin: ADMIN }) })
    expect(open.usePlatformSession.getState()).toMatchObject({ token: current, admin: ADMIN, expired: false })

    const expired = await load({ [PLATFORM_STORAGE_KEY]: JSON.stringify({ token: tokenThatExpires(-10), admin: ADMIN }) })
    expect(expired.usePlatformSession.getState()).toMatchObject({ token: null, admin: null, expired: true })
    expect(expired.storage.data.has(PLATFORM_STORAGE_KEY)).toBe(false)
  })

  it('se cierra sola cuando vence el token', async () => {
    const { usePlatformSession } = await load()
    usePlatformSession.getState().signIn(tokenThatExpires(60), ADMIN)

    await jest.advanceTimersByTimeAsync(61_000)

    expect(usePlatformSession.getState()).toMatchObject({ token: null, expired: true })
  })

  it('al cerrarse vacía solo las consultas de plataforma', async () => {
    const { usePlatformSession, queryClient } = await load()
    usePlatformSession.getState().signIn(tokenThatExpires(3600), ADMIN)
    queryClient.setQueryData(['platform', 'restaurants'], { items: [] })
    queryClient.setQueryData(['orders'], { items: [] })

    usePlatformSession.getState().signOut()

    expect(queryClient.getQueryData(['platform', 'restaurants'])).toBeUndefined()
    expect(queryClient.getQueryData(['orders'])).toEqual({ items: [] })
  })

  it('al cerrarse saca del caché las mutaciones de plataforma y sus contraseñas', async () => {
    const { usePlatformSession, queryClient } = await load()
    const { platformMutationKeys } = await import('@/api/platform')
    usePlatformSession.getState().signIn(tokenThatExpires(3600), ADMIN)
    const mutations = queryClient.getMutationCache()
    const mutationFn = () => Promise.resolve(null)
    await mutations
      .build(queryClient, { mutationKey: platformMutationKeys.addOwner, mutationFn })
      .execute({ key: 'x'.repeat(12) })
    await mutations.build(queryClient, { mutationKey: ['orders', 'create'], mutationFn }).execute(undefined)

    usePlatformSession.getState().signOut()

    expect(mutations.getAll().map((m) => m.options.mutationKey)).toEqual([['orders', 'create']])
  })

  it('su token viaja solo a /platform/* y el del restaurante al resto', async () => {
    const { usePlatformSession, fetchTables, renewPlatformSession, setAuthToken } = await load()
    const token = tokenThatExpires(3600)
    usePlatformSession.getState().signIn(token, ADMIN)
    setAuthToken('restaurante')
    const headers: Record<string, unknown> = {}
    // Sin red: anota la cabecera con la que salió cada petición.
    mswServer.use(
      http.all('*/api/v1/*', ({ request }) => {
        headers[new URL(request.url).pathname] = request.headers.get('Authorization')
        return HttpResponse.json([])
      }),
    )

    await Promise.all([renewPlatformSession(), fetchTables()])

    expect(headers['/api/v1/platform/auth/refresh']).toBe(`Bearer ${token}`)
    expect(headers['/api/v1/tables']).toBe('Bearer restaurante')
  })
})

describe('renovación de la sesión de plataforma', () => {
  it('renueva el token de la sesión que pidió la renovación', async () => {
    const { storage, usePlatformSession } = await load()
    const old = tokenThatExpires(3600)
    const fresh = tokenThatExpires(7200)
    usePlatformSession.getState().signIn(old, ADMIN)

    usePlatformSession.getState().renew(old, fresh, ADMIN)

    expect(usePlatformSession.getState().token).toBe(fresh)
    expect(JSON.parse(storage.data.get(PLATFORM_STORAGE_KEY) ?? '{}')).toEqual({ token: fresh, admin: ADMIN })
  })

  it('descarta una renovación que llega después de que la sesión cambió', async () => {
    const { storage, usePlatformSession } = await load()
    const old = tokenThatExpires(3600)
    const otherAccount = tokenThatExpires(3500)
    const OTHER = { ...ADMIN, id: 2 }
    usePlatformSession.getState().signIn(old, ADMIN)
    // Mientras viajaba la renovación se cerró la sesión y entró otra cuenta.
    usePlatformSession.getState().signOut()
    usePlatformSession.getState().signIn(otherAccount, OTHER)

    usePlatformSession.getState().renew(old, tokenThatExpires(7200), ADMIN)

    expect(usePlatformSession.getState()).toMatchObject({ token: otherAccount, admin: OTHER })
    expect(JSON.parse(storage.data.get(PLATFORM_STORAGE_KEY) ?? '{}')).toEqual({ token: otherAccount, admin: OTHER })

    // Y sin sesión abierta tampoco revive la que se cerró.
    usePlatformSession.getState().signOut()
    usePlatformSession.getState().renew(otherAccount, tokenThatExpires(7200), OTHER)
    expect(usePlatformSession.getState().token).toBeNull()
    expect(storage.data.has(PLATFORM_STORAGE_KEY)).toBe(false)
  })
})

// Una pestaña de vista previa recién cargada, con la sesión real de plataforma en localStorage.
async function loadInPreview(token: string) {
  const storage = fakeStorage({ [PLATFORM_STORAGE_KEY]: JSON.stringify({ token, admin: ADMIN }) })
  stubGlobal('localStorage', storage)
  stubGlobal('sessionStorage', fakeStorage())
  stubGlobal('location', { pathname: '/vista-previa', search: '', hash: '' })
  jest.resetModules()
  const { usePlatformSession } = await import('./platformSession')
  const { renewPlatformSession } = await import('@/api/platform')
  return { storage, usePlatformSession, renewPlatformSession }
}

describe('en una pestaña de vista previa', () => {
  it('no lee la sesión de plataforma del navegador', async () => {
    const { usePlatformSession } = await loadInPreview(tokenThatExpires(3600))
    expect(usePlatformSession.getState()).toMatchObject({ token: null, admin: null, expired: false })
  })

  it('entrar, salir o vencer queda en memoria y no toca la sesión real', async () => {
    const real = tokenThatExpires(3600)
    const { storage, usePlatformSession } = await loadInPreview(real)
    const saved = storage.data.get(PLATFORM_STORAGE_KEY)

    usePlatformSession.getState().signIn(tokenThatExpires(3600), ADMIN)
    expect(storage.data.get(PLATFORM_STORAGE_KEY)).toBe(saved)

    usePlatformSession.getState().signOut()
    expect(storage.data.get(PLATFORM_STORAGE_KEY)).toBe(saved)

    usePlatformSession.getState().signIn(tokenThatExpires(3600), ADMIN)
    usePlatformSession.getState().expire()
    expect(storage.data.get(PLATFORM_STORAGE_KEY)).toBe(saved)
  })

  it('un 401 de plataforma ahí no borra la sesión real', async () => {
    const { storage, usePlatformSession, renewPlatformSession } = await loadInPreview(tokenThatExpires(3600))
    const saved = storage.data.get(PLATFORM_STORAGE_KEY)
    usePlatformSession.getState().signIn(tokenThatExpires(3600), ADMIN)
    mswServer.use(http.all('*/api/v1/*', () => HttpResponse.json({ detail: 'vencida', code: 'unauthenticated' }, { status: 401 })))

    await expect(renewPlatformSession()).rejects.toThrow()

    expect(usePlatformSession.getState().token).toBeNull()
    expect(storage.data.get(PLATFORM_STORAGE_KEY)).toBe(saved)
  })
})
