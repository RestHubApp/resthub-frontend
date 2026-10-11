import { AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios'
import { afterEach, describe, expect, it, jest } from '@jest/globals'

import {
  api,
  isPlatformPath,
  setAuthToken,
  setPlatformAuthToken,
  setPlatformUnauthorizedHandler,
  setUnauthorizedHandler,
  tokenFor,
} from './api'

const T_RESTAURANT = 'tok-restaurante'
const T_PLATFORM = 'tok-plataforma'
const TOKENS = { restaurant: T_RESTAURANT, platform: T_PLATFORM }
const RESTAURANTS = '/platform/restaurants'
// Direcciones que engañan a quien mira solo el texto de la ruta.
const WITHOUT_BAR = 'platform/restaurants'
const LEAVES_PLATFORM = '/platform/../orders'
const OTHER_ORIGIN = '//evil.com/platform'

// Responde sin red con la cabecera que llevó la petición.
function echo(config: InternalAxiosRequestConfig): Promise<AxiosResponse<string | null>> {
  const header = config.headers.get('Authorization')
  return Promise.resolve({
    data: typeof header === 'string' ? header : null,
    status: 200,
    statusText: 'OK',
    headers: {},
    config,
  })
}

function rejection(config: InternalAxiosRequestConfig): Promise<never> {
  const response = { data: {}, status: 401, statusText: 'Unauthorized', headers: {}, config }
  return Promise.reject(new AxiosError('401', 'ERR_BAD_REQUEST', config, null, response))
}

async function headerOf(url: string): Promise<string | null> {
  const { data } = await api.get<string | null>(url, { adapter: echo })
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

  it('mira la dirección final y no el texto de la ruta', () => {
    expect(isPlatformPath(WITHOUT_BAR)).toBe(true)
    expect(isPlatformPath(LEAVES_PLATFORM)).toBe(false)
    expect(isPlatformPath('/orders/../platform/restaurants')).toBe(true)
    expect(isPlatformPath({ url: '/restaurants', baseURL: '/api/v1/platform' })).toBe(true)
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
    expect(await headerOf('/orders')).toBe('Bearer r1')
    expect(await headerOf(RESTAURANTS)).toBe('Bearer p1')
  })

  it('no sale ninguna credencial hacia otro origen', async () => {
    setAuthToken('r1')
    setPlatformAuthToken('p1')
    expect(await headerOf('https://evil.com/api/v1/platform/restaurants')).toBeNull()
    expect(await headerOf(OTHER_ORIGIN)).toBeNull()
    expect(await headerOf('https://evil.com/orders')).toBeNull()
    expect(await headerOf(WITHOUT_BAR)).toBe('Bearer p1')
    expect(await headerOf(LEAVES_PLATFORM)).toBe('Bearer r1')
  })

  it('cerrar una sesión no toca la otra', async () => {
    setAuthToken('r1')
    setPlatformAuthToken('p1')
    setPlatformAuthToken(null)
    expect(await headerOf(RESTAURANTS)).toBeNull()
    expect(await headerOf('/orders')).toBe('Bearer r1')
  })

  it('un 401 cierra solo la sesión dueña de la ruta', async () => {
    const onExpireRestaurant = jest.fn()
    const onExpirePlatform = jest.fn()
    setUnauthorizedHandler(onExpireRestaurant)
    setPlatformUnauthorizedHandler(onExpirePlatform)
    setAuthToken('r1')
    setPlatformAuthToken('p1')

    await expect(api.get(RESTAURANTS, { adapter: rejection })).rejects.toThrow()
    expect(onExpirePlatform).toHaveBeenCalledTimes(1)
    expect(onExpireRestaurant).not.toHaveBeenCalled()
  })

  it('`withoutCredential` no manda ningún token aunque haya sesiones abiertas', async () => {
    setAuthToken('r1')
    setPlatformAuthToken('p1')
    const withoutCredential = async (url: string) =>
      (await api.post<string | null>(url, {}, { adapter: echo, withoutCredential: true })).data
    expect(await withoutCredential('/auth/preview')).toBeNull()
    expect(await withoutCredential(RESTAURANTS)).toBeNull()
    // Las demás peticiones siguen con su credencial.
    expect(await headerOf('/orders')).toBe('Bearer r1')
  })

  it('un 401 de una petición `withoutCredential` no cierra la sesión abierta', async () => {
    const onExpireRestaurant = jest.fn()
    setUnauthorizedHandler(onExpireRestaurant)
    setAuthToken('r1')

    await expect(api.post('/auth/preview', {}, { adapter: rejection, withoutCredential: true })).rejects.toThrow()
    expect(onExpireRestaurant).not.toHaveBeenCalled()
  })

  it('un 401 sin credencial (contraseña equivocada) no cierra nada', async () => {
    const onExpirePlatform = jest.fn()
    setPlatformUnauthorizedHandler(onExpirePlatform)

    await expect(api.post('/platform/auth/login', {}, { adapter: rejection })).rejects.toThrow()
    expect(onExpirePlatform).not.toHaveBeenCalled()
  })
})
