import { afterEach, describe, expect, it, jest } from '@jest/globals'

import { QueryClient } from '@tanstack/react-query'

import { PLATFORM_QUERY_ROOT } from '@/services/queryClient'
import { setAuthToken } from '@/services/apiCredentials'
import { exchangePreviewCode, sessionOf } from './auth'
import { platformMutationKeys, platformSandboxQuery, resetPlatformSandbox, startPlatformPreview } from './platform'

const originalFetch = globalThis.fetch

interface Sent {
  readonly method: string
  readonly path: string
  readonly body: string
  readonly authorization: string | null
}

const sent: Sent[] = []

// Responde sin red con ese cuerpo y anota lo que salió.
function respondWith(body: unknown): void {
  globalThis.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const request = new Request(input, init)
    sent.push({
      method: request.method,
      path: new URL(request.url).pathname,
      body: await request.text(),
      authorization: request.headers.get('Authorization'),
    })
    return new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } })
  })
}

afterEach(() => {
  globalThis.fetch = originalFetch
  sent.length = 0
  setAuthToken(null)
})

describe('API de la vista previa', () => {
  it('lee el local de muestra bajo la raíz de plataforma', async () => {
    const sample = { restaurant: null, accounts: [] }
    respondWith(sample)

    await expect(new QueryClient().query(platformSandboxQuery)).resolves.toEqual(sample)
    expect(sent).toMatchObject([{ method: 'GET', path: '/api/v1/platform/sandbox' }])
    expect(platformSandboxQuery.queryKey[0]).toBe(PLATFORM_QUERY_ROOT)
  })

  it('reinicia el local de muestra con POST sin cuerpo', async () => {
    respondWith({ restaurant: null, accounts: [] })
    await resetPlatformSandbox()
    expect(sent).toEqual([{ method: 'POST', path: '/api/v1/platform/sandbox/reset', body: '', authorization: null }])
  })

  it('pide el código diciendo como quién se entra', async () => {
    respondWith({ code: 'abc', expires_in: 60 })
    await expect(startPlatformPreview({ as: 'waiter' })).resolves.toEqual({ code: 'abc', expires_in: 60 })
    expect(sent).toMatchObject([{ method: 'POST', path: '/api/v1/platform/preview', body: '{"as":"waiter"}' }])
  })

  it('las mutaciones de plataforma salen del caché con la sesión de plataforma', () => {
    expect(platformMutationKeys.startPreview[0]).toBe(PLATFORM_QUERY_ROOT)
    expect(platformMutationKeys.resetSandbox[0]).toBe(PLATFORM_QUERY_ROOT)
  })

  it('canjea el código en la ruta de restaurante, sin credencial', async () => {
    setAuthToken('sesion-abierta')
    respondWith({})
    await exchangePreviewCode({ code: 'abc' })
    expect(sent).toEqual([{ method: 'POST', path: '/api/v1/auth/preview', body: '{"code":"abc"}', authorization: null }])
  })

  it('la sesión conserva la marca de vista previa', () => {
    const response = {
      access_token: 't',
      expires_in: 1800,
      token_type: 'bearer',
      user: { id: 1 },
      restaurant: { id: 2 },
      permissions: [],
      preview: true,
    } as unknown as Parameters<typeof sessionOf>[0]
    expect(sessionOf(response)).toEqual({ user: { id: 1 }, restaurant: { id: 2 }, permissions: [], preview: true })
  })
})
