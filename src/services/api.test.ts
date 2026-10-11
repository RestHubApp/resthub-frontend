import { afterEach, describe, expect, it, jest } from '@jest/globals'

import { answerAll, answerNever, answerWithNetworkError, type Sent } from '#jest/answerAll'
import { readPlatform, readRestaurant, writeSession, writeWithoutCredential } from '#jest/apiCalls'
import { SLOW_TIMEOUT_MS } from './api'
import { setAuthToken, setUnauthorizedHandler } from './apiCredentials'
import { ApiError, errorMessage } from './apiError'
import { tokenFor } from './apiRouting'

const TOKEN = 'tok-sesion'
const RESTAURANTS = '/platform/restaurants'
const OTHER_ORIGIN = '//evil.com/platform'

/** Lo que llegó al servidor falso: la ruta y la cabecera `Authorization` de cada petición. */
const received: Sent[] = []

// Sin red: responde con ese código y anota con qué cabeceras salió la petición.
function respondWith(status: number, body: unknown = []): void {
  answerAll(status, body, received)
}

afterEach(() => {
  received.length = 0
  setAuthToken(null)
  setUnauthorizedHandler(null)
})

describe('tokenFor', () => {
  it('manda el token de la sesión a cualquier ruta del API, sea del restaurante o de plataforma', () => {
    expect(tokenFor('/platform/restaurants', TOKEN)).toBe(TOKEN)
    expect(tokenFor('/orders', TOKEN)).toBe(TOKEN)
    expect(tokenFor('platform/restaurants', TOKEN)).toBe(TOKEN)
  })

  it('a otro origen no manda ninguno', () => {
    for (const foreign of [`https://evil.com/api/v1${RESTAURANTS}`, 'https://evil.com/orders', OTHER_ORIGIN]) {
      expect(tokenFor(foreign, TOKEN)).toBeNull()
    }
  })

  it('sin sesión no manda ninguno', () => {
    expect(tokenFor('/auth/me', null)).toBeNull()
  })
})

describe('cabecera Authorization de cada petición', () => {
  it('lleva la credencial de la sesión, a las rutas del restaurante y a las de plataforma', async () => {
    setAuthToken('s1')
    respondWith(200)
    await readRestaurant()
    respondWith(200, { restaurant: null })
    await readPlatform()
    respondWith(200, { access_token: 'x' })
    await writeSession()
    expect(received.map((r) => [r.path, r.authorization])).toEqual([
      ['/api/v1/tables', 'Bearer s1'],
      ['/api/v1/platform/sandbox', 'Bearer s1'],
      ['/api/v1/auth/refresh', 'Bearer s1'],
    ])
  })

  it('sin sesión abierta no lleva ninguna', async () => {
    respondWith(200)
    await readRestaurant()
    expect(received.map((r) => r.authorization)).toEqual([null])
  })

  it('cada petición lleva un identificador propio', async () => {
    respondWith(200)
    await readRestaurant()
    await readRestaurant()
    const [first, second] = received
    expect(first?.requestId).toBeTruthy()
    expect(first?.requestId).not.toBe(second?.requestId)
  })

  it('un error de sesión (`unauthenticated`) de una petición con credencial cierra la sesión', async () => {
    const onExpire = jest.fn()
    setUnauthorizedHandler(onExpire)
    setAuthToken('s1')
    respondWith(401, { detail: 'vencida', code: 'unauthenticated' })

    await expect(writeSession()).rejects.toThrow()
    expect(onExpire).toHaveBeenCalledTimes(1)
  })

  it('el cierre de sesión lo decide el código, no el 401: `invalid_credentials` con credencial no cierra', async () => {
    const onExpireRestaurant = jest.fn()
    setUnauthorizedHandler(onExpireRestaurant)
    setAuthToken('r1')
    respondWith(401, { detail: 'Correo o contraseña incorrectos.', code: 'invalid_credentials' })

    await expect(readRestaurant()).rejects.toThrow()
    expect(onExpireRestaurant).not.toHaveBeenCalled()

    respondWith(401, { detail: 'La credencial no vale.', code: 'invalid_token' })
    await expect(readRestaurant()).rejects.toThrow()
    expect(onExpireRestaurant).toHaveBeenCalledTimes(1)
  })

  it('`withoutCredential` no manda ningún token aunque haya sesiones abiertas', async () => {
    setAuthToken('r1')
    respondWith(200, { access_token: 'x' })
    await writeWithoutCredential()
    await readRestaurant()
    expect(received.map((r) => r.authorization)).toEqual([null, 'Bearer r1'])
  })

  it('un `unauthenticated` de una petición `withoutCredential` no cierra la sesión abierta', async () => {
    const onExpireRestaurant = jest.fn()
    setUnauthorizedHandler(onExpireRestaurant)
    setAuthToken('r1')
    respondWith(401, { detail: 'vencida', code: 'unauthenticated' })

    await expect(writeWithoutCredential()).rejects.toThrow()
    expect(onExpireRestaurant).not.toHaveBeenCalled()
  })

  it('un `unauthenticated` sin credencial (contraseña equivocada) no cierra nada', async () => {
    const onExpire = jest.fn()
    setUnauthorizedHandler(onExpire)
    respondWith(401, { detail: 'Correo o contraseña incorrectos.', code: 'invalid_credentials' })

    await expect(writeSession()).rejects.toThrow()
    expect(onExpire).not.toHaveBeenCalled()
  })
})

describe('errores de la petición', () => {
  it('un error del servidor rechaza con ApiError, su código y su cuerpo', async () => {
    respondWith(409, { detail: 'El pedido cambió', code: 'conflict' })
    const error: unknown = await readRestaurant().catch((cause: unknown) => cause)
    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ status: 409, code: 'conflict', body: { detail: 'El pedido cambió' }, method: 'get', path: '/api/v1/tables' })
  })

  it('un 422 de validación trae `detail` como lista, `errors` y `code: validation_error`', async () => {
    const problems = [{ loc: ['body', 'name'], msg: 'El nombre es obligatorio', type: 'missing' }]
    respondWith(422, { detail: problems, errors: problems, code: 'validation_error' })
    const error: unknown = await readRestaurant().catch((cause: unknown) => cause)
    expect(error).toMatchObject({ status: 422, code: 'validation_error' })
    expect(errorMessage(error, 'x')).toBe('El nombre es obligatorio')
  })

  it('un corte de red rechaza sin código HTTP', async () => {
    answerWithNetworkError()
    const error: unknown = await readRestaurant().catch((cause: unknown) => cause)
    expect(error).toMatchObject({ status: undefined, reason: 'network' })
  })

  it('una petición que no responde a tiempo rechaza con `timeout`', async () => {
    // MSW espera con setImmediate y microtareas: si se falsean, responde 500 en vez de quedarse colgado.
    jest.useFakeTimers({ doNotFake: ['setImmediate', 'nextTick', 'queueMicrotask'] })
    answerNever()
    const pending = readRestaurant().catch((cause: unknown) => cause)
    await jest.advanceTimersByTimeAsync(15_001)
    expect(await pending).toMatchObject({ reason: 'timeout' })
    jest.useRealTimers()
  })

  it('el plazo de lo lento es mayor que el de una petición común', () => {
    expect(SLOW_TIMEOUT_MS).toBeGreaterThan(15_000)
  })
})
