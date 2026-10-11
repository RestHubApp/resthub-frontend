import { afterEach, describe, expect, it, jest } from '@jest/globals'

import { readRestaurant, writePlatform, writeWithoutCredential } from '#jest/apiCalls'
import { SLOW_TIMEOUT_MS } from './api'
import { setAuthToken, setPlatformAuthToken, setPlatformUnauthorizedHandler, setUnauthorizedHandler } from './apiCredentials'
import { ApiError } from './apiError'
import { isPlatformPath, tokenFor } from './apiRouting'

const T_RESTAURANT = 'tok-restaurante'
const T_PLATFORM = 'tok-plataforma'
const TOKENS = { restaurant: T_RESTAURANT, platform: T_PLATFORM }
const RESTAURANTS = '/platform/restaurants'
// Direcciones que engañan a quien mira solo el texto de la ruta.
const WITHOUT_BAR = 'platform/restaurants'
const LEAVES_PLATFORM = '/platform/../orders'
const OTHER_ORIGIN = '//evil.com/platform'

const originalFetch = globalThis.fetch

/** Lo que llegó al servidor falso: la ruta y la cabecera `Authorization` de cada petición. */
const received: { path: string; authorization: string | null; requestId: string | null }[] = []

// Sin red: responde con ese código y anota con qué cabeceras salió la petición.
function respondWith(status: number, body: unknown = []): void {
  globalThis.fetch = jest.fn((input: RequestInfo | URL, init?: RequestInit) => {
    const request = new Request(input, init)
    received.push({
      path: new URL(request.url).pathname,
      authorization: request.headers.get('Authorization'),
      requestId: request.headers.get('X-Request-ID'),
    })
    return Promise.resolve(new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } }))
  })
}

// Una conexión que no responde: solo termina cuando se aborta su señal.
function hangingFetch(_input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  return new Promise<Response>((_resolve, reject) => {
    init?.signal?.addEventListener('abort', () => {
      reject(new DOMException('Abortado', 'AbortError'))
    })
  })
}

afterEach(() => {
  globalThis.fetch = originalFetch
  received.length = 0
  setAuthToken(null)
  setPlatformAuthToken(null)
  setUnauthorizedHandler(null)
  setPlatformUnauthorizedHandler(null)
})

describe('isPlatformPath', () => {
  it('reconoce el prefijo completo, con o sin consulta', () => {
    expect(isPlatformPath('/platform')).toBe(true)
    expect(isPlatformPath('/platform/auth/login')).toBe(true)
    expect(isPlatformPath('/platform/restaurants?search=sol')).toBe(true)
  })

  it('no confunde rutas parecidas ni vacías', () => {
    expect(isPlatformPath('/platformas')).toBe(false)
    expect(isPlatformPath('/restaurant/platform')).toBe(false)
    expect(isPlatformPath('/auth/me')).toBe(false)
    expect(isPlatformPath(undefined)).toBe(false)
  })

  it('mira la dirección final y no el texto de la ruta', () => {
    expect(isPlatformPath(WITHOUT_BAR)).toBe(true)
    expect(isPlatformPath(LEAVES_PLATFORM)).toBe(false)
    expect(isPlatformPath('/orders/../platform/restaurants')).toBe(true)
  })

  it('una dirección de otro origen no es de plataforma', () => {
    expect(isPlatformPath(`https://evil.com/api/v1${RESTAURANTS}`)).toBe(false)
    expect(isPlatformPath(OTHER_ORIGIN)).toBe(false)
  })
})

describe('tokenFor', () => {
  it('manda el token de plataforma solo a /platform/*', () => {
    expect(tokenFor('/platform/restaurants', TOKENS)).toBe(T_PLATFORM)
    expect(tokenFor('/orders', TOKENS)).toBe(T_RESTAURANT)
  })

  it('a otro origen no manda ninguno', () => {
    for (const foreign of [`https://evil.com/api/v1${RESTAURANTS}`, 'https://evil.com/orders', OTHER_ORIGIN]) {
      expect(tokenFor(foreign, TOKENS)).toBeNull()
    }
  })

  it('una ruta sin barra o con `..` lleva el token de su destino real', () => {
    expect(tokenFor(WITHOUT_BAR, TOKENS)).toBe(T_PLATFORM)
    expect(tokenFor(LEAVES_PLATFORM, TOKENS)).toBe(T_RESTAURANT)
  })

  it('sin la sesión de la ruta no manda ninguno, aunque la otra esté abierta', () => {
    expect(tokenFor('/platform/auth/me', { restaurant: T_RESTAURANT, platform: null })).toBeNull()
    expect(tokenFor('/auth/me', { restaurant: null, platform: T_PLATFORM })).toBeNull()
  })
})

describe('cabecera Authorization de cada petición', () => {
  it('lleva la credencial de la sesión dueña de la ruta', async () => {
    setAuthToken('r1')
    setPlatformAuthToken('p1')
    respondWith(200)
    await readRestaurant()
    respondWith(200, { access_token: 'x' })
    await writePlatform()
    expect(received.map((r) => [r.path, r.authorization])).toEqual([
      ['/api/v1/tables', 'Bearer r1'],
      ['/api/v1/platform/auth/refresh', 'Bearer p1'],
    ])
  })

  it('cerrar una sesión no toca la otra', async () => {
    setAuthToken('r1')
    setPlatformAuthToken('p1')
    setPlatformAuthToken(null)
    respondWith(200, { access_token: 'x' })
    await writePlatform()
    respondWith(200)
    await readRestaurant()
    expect(received.map((r) => r.authorization)).toEqual([null, 'Bearer r1'])
  })

  it('cada petición lleva un identificador propio', async () => {
    respondWith(200)
    await readRestaurant()
    await readRestaurant()
    const [first, second] = received
    expect(first?.requestId).toBeTruthy()
    expect(first?.requestId).not.toBe(second?.requestId)
  })

  it('un 401 cierra solo la sesión dueña de la ruta', async () => {
    const onExpireRestaurant = jest.fn()
    const onExpirePlatform = jest.fn()
    setUnauthorizedHandler(onExpireRestaurant)
    setPlatformUnauthorizedHandler(onExpirePlatform)
    setAuthToken('r1')
    setPlatformAuthToken('p1')
    respondWith(401, { detail: 'vencida' })

    await expect(writePlatform()).rejects.toThrow()
    expect(onExpirePlatform).toHaveBeenCalledTimes(1)
    expect(onExpireRestaurant).not.toHaveBeenCalled()
  })

  it('`withoutCredential` no manda ningún token aunque haya sesiones abiertas', async () => {
    setAuthToken('r1')
    setPlatformAuthToken('p1')
    respondWith(200, { access_token: 'x' })
    await writeWithoutCredential()
    await readRestaurant()
    expect(received.map((r) => r.authorization)).toEqual([null, 'Bearer r1'])
  })

  it('un 401 de una petición `withoutCredential` no cierra la sesión abierta', async () => {
    const onExpireRestaurant = jest.fn()
    setUnauthorizedHandler(onExpireRestaurant)
    setAuthToken('r1')
    respondWith(401)

    await expect(writeWithoutCredential()).rejects.toThrow()
    expect(onExpireRestaurant).not.toHaveBeenCalled()
  })

  it('un 401 sin credencial (contraseña equivocada) no cierra nada', async () => {
    const onExpirePlatform = jest.fn()
    setPlatformUnauthorizedHandler(onExpirePlatform)
    respondWith(401)

    await expect(writePlatform()).rejects.toThrow()
    expect(onExpirePlatform).not.toHaveBeenCalled()
  })
})

describe('errores de la petición', () => {
  it('un error del servidor rechaza con ApiError, su código y su cuerpo', async () => {
    respondWith(409, { detail: 'El pedido cambió' })
    const error: unknown = await readRestaurant().catch((cause: unknown) => cause)
    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ status: 409, body: { detail: 'El pedido cambió' }, method: 'get', path: '/api/v1/tables' })
  })

  it('un corte de red rechaza sin código HTTP', async () => {
    globalThis.fetch = jest.fn(() => Promise.reject(new TypeError('Failed to fetch')))
    const error: unknown = await readRestaurant().catch((cause: unknown) => cause)
    expect(error).toMatchObject({ status: undefined, code: 'network' })
  })

  it('una petición que no responde a tiempo rechaza con `timeout`', async () => {
    jest.useFakeTimers()
    globalThis.fetch = hangingFetch
    const pending = readRestaurant().catch((cause: unknown) => cause)
    await jest.advanceTimersByTimeAsync(15_001)
    expect(await pending).toMatchObject({ code: 'timeout' })
    jest.useRealTimers()
  })

  it('el plazo de lo lento es mayor que el de una petición común', () => {
    expect(SLOW_TIMEOUT_MS).toBeGreaterThan(15_000)
  })
})
