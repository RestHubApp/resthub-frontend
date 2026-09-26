import { AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios'
import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  api,
  isPlatformPath,
  setAuthToken,
  setPlatformAuthToken,
  setPlatformUnauthorizedHandler,
  setUnauthorizedHandler,
  tokenFor,
} from './api'

const T_RESTAURANTE = 'tok-restaurante'
const T_PLATAFORMA = 'tok-plataforma'
const TOKENS = { restaurant: T_RESTAURANTE, platform: T_PLATAFORMA }
const RESTAURANTES = '/platform/restaurants'

// Responde sin red con la cabecera que llevó la petición.
function eco(config: InternalAxiosRequestConfig): Promise<AxiosResponse<string | null>> {
  const cabecera = config.headers.get('Authorization')
  return Promise.resolve({
    data: typeof cabecera === 'string' ? cabecera : null,
    status: 200,
    statusText: 'OK',
    headers: {},
    config,
  })
}

function rechazo(config: InternalAxiosRequestConfig): Promise<never> {
  const response = { data: {}, status: 401, statusText: 'Unauthorized', headers: {}, config }
  return Promise.reject(new AxiosError('401', 'ERR_BAD_REQUEST', config, null, response))
}

async function cabeceraDe(url: string): Promise<string | null> {
  const { data } = await api.get<string | null>(url, { adapter: eco })
  return data
}

afterEach(() => {
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
})

describe('tokenFor', () => {
  it('manda el token de plataforma solo a /platform/*', () => {
    expect(tokenFor('/platform/restaurants', TOKENS)).toBe(T_PLATAFORMA)
    expect(tokenFor('/orders', TOKENS)).toBe(T_RESTAURANTE)
  })

  it('sin la sesión de la ruta no manda ninguno, aunque la otra esté abierta', () => {
    expect(tokenFor('/platform/auth/me', { restaurant: T_RESTAURANTE, platform: null })).toBeNull()
    expect(tokenFor('/auth/me', { restaurant: null, platform: T_PLATAFORMA })).toBeNull()
  })
})

describe('cabecera Authorization de cada petición', () => {
  it('lleva la credencial de la sesión dueña de la ruta', async () => {
    setAuthToken('r1')
    setPlatformAuthToken('p1')
    expect(await cabeceraDe('/orders')).toBe('Bearer r1')
    expect(await cabeceraDe(RESTAURANTES)).toBe('Bearer p1')
  })

  it('cerrar una sesión no toca la otra', async () => {
    setAuthToken('r1')
    setPlatformAuthToken('p1')
    setPlatformAuthToken(null)
    expect(await cabeceraDe(RESTAURANTES)).toBeNull()
    expect(await cabeceraDe('/orders')).toBe('Bearer r1')
  })

  it('un 401 cierra solo la sesión dueña de la ruta', async () => {
    const alVencerRestaurante = vi.fn()
    const alVencerPlataforma = vi.fn()
    setUnauthorizedHandler(alVencerRestaurante)
    setPlatformUnauthorizedHandler(alVencerPlataforma)
    setAuthToken('r1')
    setPlatformAuthToken('p1')

    await expect(api.get(RESTAURANTES, { adapter: rechazo })).rejects.toThrow()
    expect(alVencerPlataforma).toHaveBeenCalledOnce()
    expect(alVencerRestaurante).not.toHaveBeenCalled()
  })

  it('un 401 sin credencial (contraseña equivocada) no cierra nada', async () => {
    const alVencerPlataforma = vi.fn()
    setPlatformUnauthorizedHandler(alVencerPlataforma)

    await expect(api.post('/platform/auth/login', {}, { adapter: rechazo })).rejects.toThrow()
    expect(alVencerPlataforma).not.toHaveBeenCalled()
  })
})
