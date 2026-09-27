import { beforeEach, describe, expect, it, jest } from '@jest/globals'

import { PLATFORM_QUERY_ROOT } from '../services/queryClient'
import { exchangePreviewCode, sessionOf } from './auth'
import { platformMutationKeys, platformSandboxQuery, resetPlatformSandbox, startPlatformPreview } from './platform'

// Jest sube `jest.mock` por encima de los import; la fábrica solo puede usar
// variables con prefijo `mock`, que se leen cuando se llama a la función.
const mockGet = jest.fn<(...args: unknown[]) => Promise<unknown>>()
const mockPost = jest.fn<(...args: unknown[]) => Promise<unknown>>()
const get = mockGet
const post = mockPost

jest.mock('../services/api', () => ({
  api: { get: (...args: unknown[]) => mockGet(...args), post: (...args: unknown[]) => mockPost(...args) },
  debeReintentar: () => false,
}))

beforeEach(() => {
  get.mockReset()
  post.mockReset()
})

describe('API de la vista previa', () => {
  it('lee el local de muestra bajo la raíz de plataforma', async () => {
    const muestra = { restaurant: null, accounts: [] }
    get.mockResolvedValue({ data: muestra })

    const queryFn = platformSandboxQuery.queryFn as () => Promise<unknown>
    await expect(queryFn()).resolves.toBe(muestra)
    expect(get).toHaveBeenCalledWith('/platform/sandbox')
    expect(platformSandboxQuery.queryKey[0]).toBe(PLATFORM_QUERY_ROOT)
  })

  it('reinicia el local de muestra con POST sin cuerpo', async () => {
    post.mockResolvedValue({ data: { restaurant: null, accounts: [] } })
    await resetPlatformSandbox()
    expect(post).toHaveBeenCalledWith('/platform/sandbox/reset')
  })

  it('pide el código diciendo como quién se entra', async () => {
    post.mockResolvedValue({ data: { code: 'abc', expires_in: 60 } })
    await expect(startPlatformPreview({ as: 'waiter' })).resolves.toEqual({ code: 'abc', expires_in: 60 })
    expect(post).toHaveBeenCalledWith('/platform/preview', { as: 'waiter' })
  })

  it('las mutaciones de plataforma salen del caché con la sesión de plataforma', () => {
    expect(platformMutationKeys.startPreview[0]).toBe(PLATFORM_QUERY_ROOT)
    expect(platformMutationKeys.resetSandbox[0]).toBe(PLATFORM_QUERY_ROOT)
  })

  it('canjea el código en la ruta de restaurante, sin credencial', async () => {
    post.mockResolvedValue({ data: {} })
    await exchangePreviewCode({ code: 'abc' })
    expect(post).toHaveBeenCalledWith('/auth/preview', { code: 'abc' }, { withoutCredential: true })
  })

  it('la sesión conserva la marca de vista previa', () => {
    const respuesta = {
      access_token: 't',
      expires_in: 1800,
      token_type: 'bearer',
      user: { id: 1 },
      restaurant: { id: 2 },
      permissions: [],
      preview: true,
    } as unknown as Parameters<typeof sessionOf>[0]
    expect(sessionOf(respuesta)).toEqual({ user: { id: 1 }, restaurant: { id: 2 }, permissions: [], preview: true })
  })
})
