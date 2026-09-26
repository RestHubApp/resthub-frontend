import type { InternalAxiosRequestConfig } from 'axios'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const CLAVE = 'resthub.platform-session.v1'
const CLAVE_RESTAURANTE = 'resthub.session.v2'
const ADMIN = { id: 1, full_name: 'Equipo RestHub', email: 'plataforma@resthub.dev' }

function tokenQueVence(segundosDesdeAhora: number): string {
  const exp = Math.floor(Date.now() / 1000) + segundosDesdeAhora
  return `cabecera.${btoa(JSON.stringify({ exp, scope: 'platform' }))}.firma`
}

function fakeStorage(inicial: Record<string, string> = {}) {
  const datos = new Map(Object.entries(inicial))
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
async function cargar(inicial: Record<string, string> = {}) {
  const storage = fakeStorage(inicial)
  vi.stubGlobal('localStorage', storage)
  vi.resetModules()
  const { usePlatformSession } = await import('./platformSession')
  const { api, setAuthToken } = await import('../services/api')
  const { queryClient } = await import('../services/queryClient')
  return { storage, usePlatformSession, api, setAuthToken, queryClient }
}

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('sesión de plataforma', () => {
  it('se guarda en su propia clave y no toca la del restaurante', async () => {
    const restaurante = JSON.stringify({ token: 'r', account: {} })
    const { storage, usePlatformSession } = await cargar({ [CLAVE_RESTAURANTE]: restaurante })
    const token = tokenQueVence(3600)

    usePlatformSession.getState().signIn(token, ADMIN)

    expect(JSON.parse(storage.datos.get(CLAVE) ?? '{}')).toEqual({ token, admin: ADMIN })
    expect(storage.datos.get(CLAVE_RESTAURANTE)).toBe(restaurante)

    usePlatformSession.getState().signOut()
    expect(storage.datos.has(CLAVE)).toBe(false)
    expect(storage.datos.get(CLAVE_RESTAURANTE)).toBe(restaurante)
  })

  it('recupera una sesión guardada vigente y descarta una vencida', async () => {
    const vigente = tokenQueVence(3600)
    const abierta = await cargar({ [CLAVE]: JSON.stringify({ token: vigente, admin: ADMIN }) })
    expect(abierta.usePlatformSession.getState()).toMatchObject({ token: vigente, admin: ADMIN, expired: false })

    const vencida = await cargar({ [CLAVE]: JSON.stringify({ token: tokenQueVence(-10), admin: ADMIN }) })
    expect(vencida.usePlatformSession.getState()).toMatchObject({ token: null, admin: null, expired: true })
    expect(vencida.storage.datos.has(CLAVE)).toBe(false)
  })

  it('se cierra sola cuando vence el token', async () => {
    const { usePlatformSession } = await cargar()
    usePlatformSession.getState().signIn(tokenQueVence(60), ADMIN)

    await vi.advanceTimersByTimeAsync(61_000)

    expect(usePlatformSession.getState()).toMatchObject({ token: null, expired: true })
  })

  it('al cerrarse vacía solo las consultas de plataforma', async () => {
    const { usePlatformSession, queryClient } = await cargar()
    usePlatformSession.getState().signIn(tokenQueVence(3600), ADMIN)
    queryClient.setQueryData(['platform', 'restaurants'], { items: [] })
    queryClient.setQueryData(['orders'], { items: [] })

    usePlatformSession.getState().signOut()

    expect(queryClient.getQueryData(['platform', 'restaurants'])).toBeUndefined()
    expect(queryClient.getQueryData(['orders'])).toEqual({ items: [] })
  })

  it('al cerrarse saca del caché las mutaciones de plataforma y sus contraseñas', async () => {
    const { usePlatformSession, queryClient } = await cargar()
    const { platformMutationKeys } = await import('../api/platform')
    usePlatformSession.getState().signIn(tokenQueVence(3600), ADMIN)
    const mutaciones = queryClient.getMutationCache()
    const mutationFn = () => Promise.resolve(null)
    await mutaciones
      .build(queryClient, { mutationKey: platformMutationKeys.addOwner, mutationFn })
      .execute({ password: 'x'.repeat(12) })
    await mutaciones.build(queryClient, { mutationKey: ['orders', 'create'], mutationFn }).execute(undefined)

    usePlatformSession.getState().signOut()

    expect(mutaciones.getAll().map((m) => m.options.mutationKey)).toEqual([['orders', 'create']])
  })

  it('su token viaja solo a /platform/* y el del restaurante al resto', async () => {
    const { usePlatformSession, api, setAuthToken } = await cargar()
    const token = tokenQueVence(3600)
    usePlatformSession.getState().signIn(token, ADMIN)
    setAuthToken('restaurante')
    const cabeceras: Record<string, unknown> = {}
    // Sin red: el adaptador anota la cabecera con la que salió cada petición.
    const adapter = (config: InternalAxiosRequestConfig) => {
      cabeceras[config.url ?? ''] = config.headers.get('Authorization')
      return Promise.resolve({ data: null, status: 204, statusText: '', headers: {}, config })
    }

    await Promise.all([api.get('/platform/restaurants', { adapter }), api.get('/orders', { adapter })])

    expect(cabeceras['/platform/restaurants']).toBe(`Bearer ${token}`)
    expect(cabeceras['/orders']).toBe('Bearer restaurante')
  })
})
