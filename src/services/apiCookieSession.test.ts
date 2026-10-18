import { afterEach, describe, expect, it, jest } from '@jest/globals'
import { HttpResponse, http } from 'msw'

import { readRestaurant, writeRestaurant, writeWithoutCredential } from '#jest/apiCalls'
import { mswServer } from '#jest/mswServer'
import {
  csrfToken,
  setAuthToken,
  setCookieSession,
  setCsrfRecovery,
  setCsrfToken,
  setUnauthorizedHandler,
} from './apiCredentials'

// La sesión en la cookie `HttpOnly` del API (S2): cada petición viaja con
// credenciales, lo que cambia algo lleva el valor anti-CSRF y, tras recargar,
// la sesión sigue aunque no haya token en memoria.

interface Seen {
  readonly method: string
  readonly csrf: string | null
  readonly authorization: string | null
}

const seen: Seen[] = []

/** Responde con lo que diga `answer` según el valor anti-CSRF que llegó, y anota cada petición. */
function serve(answer: (csrf: string | null) => { status: number; body: unknown }): void {
  mswServer.use(
    http.all('*/api/v1/*', ({ request }) => {
      const csrf = request.headers.get('X-CSRF-Token')
      seen.push({ method: request.method, csrf, authorization: request.headers.get('Authorization') })
      const { status, body } = answer(csrf)
      return HttpResponse.json(body as Record<string, unknown>, { status })
    }),
  )
}

const ok = () => ({ status: 200, body: {} })

afterEach(() => {
  seen.length = 0
  setAuthToken(null)
  setCookieSession(false)
  setCsrfRecovery(null)
  setUnauthorizedHandler(null)
  jest.restoreAllMocks()
})

describe('credenciales de cada petición', () => {
  it('viaja con las cookies del API, salvo lo que sale sin credencial', async () => {
    const fetchSpy = jest.spyOn(globalThis, 'fetch')
    serve(ok)
    await readRestaurant()
    await writeWithoutCredential()
    expect(fetchSpy.mock.calls.map(([, init]) => init?.credentials)).toEqual(['include', 'omit'])
  })

  it('lo que cambia algo lleva el valor anti-CSRF; una lectura no', async () => {
    setCsrfToken('valor-1')
    serve(ok)
    await readRestaurant()
    await writeRestaurant()
    expect(seen.map((request) => [request.method, request.csrf])).toEqual([
      ['GET', null],
      ['POST', 'valor-1'],
    ])
  })

  it('un valor vacío o ausente no reemplaza al que se conoce', () => {
    setCsrfToken('valor-2')
    setCsrfToken(null)
    setCsrfToken('')
    expect(csrfToken()).toBe('valor-2')
  })
})

describe('sesión solo en la cookie', () => {
  it('sin token, un 401 avisa que la cookie ya no sirve', async () => {
    const rejected = jest.fn()
    setUnauthorizedHandler(rejected)
    setCookieSession(true)
    serve(() => ({ status: 401, body: { code: 'unauthenticated', message: 'Inicia sesión.' } }))

    await expect(readRestaurant()).rejects.toMatchObject({ status: 401 })

    expect(seen[0]?.authorization).toBeNull()
    expect(rejected).toHaveBeenCalledWith(null)
  })

  it('con token, el 401 avisa cuál token se rechazó', async () => {
    const rejected = jest.fn()
    setUnauthorizedHandler(rejected)
    setAuthToken('tok-1')
    serve(() => ({ status: 401, body: { code: 'unauthenticated', message: 'Inicia sesión.' } }))

    await expect(readRestaurant()).rejects.toMatchObject({ status: 401 })

    expect(rejected).toHaveBeenCalledWith('tok-1')
  })

  it('si el valor anti-CSRF cambió, lo relee y repite una vez la petición', async () => {
    setCsrfToken('viejo')
    setCsrfRecovery(() => {
      setCsrfToken('nuevo')
      return Promise.resolve(true)
    })
    serve((csrf) =>
      csrf === 'nuevo' ? ok() : { status: 403, body: { code: 'csrf_token_invalid', message: 'Falta la cabecera.' } },
    )

    await writeRestaurant()

    expect(seen.map((request) => request.csrf)).toEqual(['viejo', 'nuevo'])
  })

  it('si no puede releerlo, devuelve el 403 sin repetir', async () => {
    setCsrfToken('viejo')
    setCsrfRecovery(() => Promise.resolve(false))
    serve(() => ({ status: 403, body: { code: 'csrf_token_invalid', message: 'Falta la cabecera.' } }))

    await expect(writeRestaurant()).rejects.toMatchObject({ status: 403, code: 'csrf_token_invalid' })

    expect(seen).toHaveLength(1)
  })
})
