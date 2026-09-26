import { AxiosError, type InternalAxiosRequestConfig } from 'axios'
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

describe('renovación de la sesión de plataforma', () => {
  it('renueva el token de la sesión que pidió la renovación', async () => {
    const { storage, usePlatformSession } = await cargar()
    const viejo = tokenQueVence(3600)
    const nuevo = tokenQueVence(7200)
    usePlatformSession.getState().signIn(viejo, ADMIN)

    usePlatformSession.getState().renew(viejo, nuevo, ADMIN)

    expect(usePlatformSession.getState().token).toBe(nuevo)
    expect(JSON.parse(storage.datos.get(CLAVE) ?? '{}')).toEqual({ token: nuevo, admin: ADMIN })
  })

  it('descarta una renovación que llega después de que la sesión cambió', async () => {
    const { storage, usePlatformSession } = await cargar()
    const viejo = tokenQueVence(3600)
    const otraCuenta = tokenQueVence(3500)
    const OTRO = { ...ADMIN, id: 2 }
    usePlatformSession.getState().signIn(viejo, ADMIN)
    // Mientras viajaba la renovación se cerró la sesión y entró otra cuenta.
    usePlatformSession.getState().signOut()
    usePlatformSession.getState().signIn(otraCuenta, OTRO)

    usePlatformSession.getState().renew(viejo, tokenQueVence(7200), ADMIN)

    expect(usePlatformSession.getState()).toMatchObject({ token: otraCuenta, admin: OTRO })
    expect(JSON.parse(storage.datos.get(CLAVE) ?? '{}')).toEqual({ token: otraCuenta, admin: OTRO })

    // Y sin sesión abierta tampoco revive la que se cerró.
    usePlatformSession.getState().signOut()
    usePlatformSession.getState().renew(otraCuenta, tokenQueVence(7200), OTRO)
    expect(usePlatformSession.getState().token).toBeNull()
    expect(storage.datos.has(CLAVE)).toBe(false)
  })
})

// Una pestaña de vista previa recién cargada, con la sesión real de plataforma en localStorage.
async function cargarEnVistaPrevia(token: string) {
  const storage = fakeStorage({ [CLAVE]: JSON.stringify({ token, admin: ADMIN }) })
  vi.stubGlobal('localStorage', storage)
  vi.stubGlobal('sessionStorage', fakeStorage())
  vi.stubGlobal('location', { pathname: '/vista-previa', search: '', hash: '' })
  vi.resetModules()
  const { usePlatformSession } = await import('./platformSession')
  const { api } = await import('../services/api')
  return { storage, usePlatformSession, api }
}

describe('en una pestaña de vista previa', () => {
  it('no lee la sesión de plataforma del navegador', async () => {
    const { usePlatformSession } = await cargarEnVistaPrevia(tokenQueVence(3600))
    expect(usePlatformSession.getState()).toMatchObject({ token: null, admin: null, expired: false })
  })

  it('entrar, salir o vencer queda en memoria y no toca la sesión real', async () => {
    const real = tokenQueVence(3600)
    const { storage, usePlatformSession } = await cargarEnVistaPrevia(real)
    const guardada = storage.datos.get(CLAVE)

    usePlatformSession.getState().signIn(tokenQueVence(3600), ADMIN)
    expect(storage.datos.get(CLAVE)).toBe(guardada)

    usePlatformSession.getState().signOut()
    expect(storage.datos.get(CLAVE)).toBe(guardada)

    usePlatformSession.getState().signIn(tokenQueVence(3600), ADMIN)
    usePlatformSession.getState().expire()
    expect(storage.datos.get(CLAVE)).toBe(guardada)
  })

  it('un 401 de plataforma ahí no borra la sesión real', async () => {
    const { storage, usePlatformSession, api } = await cargarEnVistaPrevia(tokenQueVence(3600))
    const guardada = storage.datos.get(CLAVE)
    usePlatformSession.getState().signIn(tokenQueVence(3600), ADMIN)
    const adapter = (config: InternalAxiosRequestConfig) => {
      const response = { data: {}, status: 401, statusText: 'Unauthorized', headers: {}, config }
      return Promise.reject(new AxiosError('401', 'ERR_BAD_REQUEST', config, null, response))
    }

    await expect(api.get('/platform/restaurants', { adapter })).rejects.toThrow()

    expect(usePlatformSession.getState().token).toBeNull()
    expect(storage.datos.get(CLAVE)).toBe(guardada)
  })
})
