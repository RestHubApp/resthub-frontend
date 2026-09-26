import { queryOptions } from '@tanstack/react-query'

import { api } from '../services/api'
import { PLATFORM_QUERY_ROOT } from '../services/queryClient'
import type {
  CreatePlatformRestaurantRequest,
  PlatformActivityPage,
  PlatformActivityParams,
  PlatformLoginRequest,
  PlatformMeResponse,
  PlatformOwner,
  PlatformOwnerRequest,
  PlatformRestaurantDetail,
  PlatformRestaurantListParams,
  PlatformRestaurantPage,
  PlatformSandbox,
  PlatformTokenResponse,
  PreviewCodeResponse,
  PreviewRequest,
  UpdatePlatformRestaurantRequest,
} from './types'

// El administrador del sistema: el equipo de RestHub, que da de alta los
// restaurantes y los activa o desactiva. Todas sus rutas van bajo
// `/platform`, y el cliente HTTP les pone el token de esa sesión y nunca el
// de un restaurante.

export const platformQueryKey = [PLATFORM_QUERY_ROOT] as const
export const platformRestaurantsQueryKey = [...platformQueryKey, 'restaurants'] as const
export const platformActivityQueryKey = [...platformQueryKey, 'activity'] as const
export const platformSandboxQueryKey = [...platformQueryKey, 'sandbox'] as const

// Las escrituras llevan la misma raíz: cerrar la sesión de plataforma las saca
// del caché de mutaciones, que guarda lo enviado, y cerrar la del restaurante
// no las toca.
export const platformMutationKeys = {
  login: [...platformQueryKey, 'login'],
  createRestaurant: [...platformRestaurantsQueryKey, 'create'],
  updateRestaurant: [...platformRestaurantsQueryKey, 'update'],
  addOwner: [...platformRestaurantsQueryKey, 'owners', 'add'],
  resetSandbox: [...platformSandboxQueryKey, 'reset'],
  startPreview: [...platformQueryKey, 'preview'],
} as const

/**
 * Para las mutaciones que llevan una contraseña: en cuanto nadie mira su
 * resultado, salen del caché en vez de esperar los cinco minutos de siempre.
 */
export const PASSWORD_MUTATION_GC_TIME = 0

/** Lo que el servidor devuelve por página si no se le pide otra cosa. */
export const PLATFORM_PAGE_SIZE = 25

function restaurantPath(restaurantId: number, action = ''): string {
  return `/platform/restaurants/${String(restaurantId)}${action}`
}

export async function platformLogin(payload: PlatformLoginRequest): Promise<PlatformTokenResponse> {
  const { data } = await api.post<PlatformTokenResponse>('/platform/auth/login', payload)
  return data
}

/** Un token nuevo para la sesión de plataforma, pedido antes de que venza el que hay. */
export async function renewPlatformSession(): Promise<PlatformTokenResponse> {
  const { data } = await api.post<PlatformTokenResponse>('/platform/auth/refresh')
  return data
}

export const platformMeQuery = queryOptions({
  queryKey: [...platformQueryKey, 'me'],
  queryFn: async () => {
    const { data } = await api.get<PlatformMeResponse>('/platform/auth/me')
    return data
  },
})

export function platformRestaurantsQuery(params: PlatformRestaurantListParams) {
  return queryOptions({
    queryKey: [...platformRestaurantsQueryKey, 'list', params],
    queryFn: async () => {
      const { data } = await api.get<PlatformRestaurantPage>('/platform/restaurants', { params })
      return data
    },
  })
}

export function platformRestaurantQueryKey(restaurantId: number) {
  return [...platformRestaurantsQueryKey, 'detail', restaurantId] as const
}

export function platformRestaurantQuery(restaurantId: number) {
  return queryOptions({
    queryKey: platformRestaurantQueryKey(restaurantId),
    queryFn: async () => {
      const { data } = await api.get<PlatformRestaurantDetail>(restaurantPath(restaurantId))
      return data
    },
  })
}

/** Crea el restaurante, sus roles base y su primer encargado en una sola operación. */
export async function createPlatformRestaurant(
  payload: CreatePlatformRestaurantRequest,
): Promise<PlatformRestaurantDetail> {
  const { data } = await api.post<PlatformRestaurantDetail>('/platform/restaurants', payload)
  return data
}

/** Nombre, zona horaria o estado. Desactivar corta al instante el acceso de su personal entero. */
export async function updatePlatformRestaurant(
  restaurantId: number,
  payload: UpdatePlatformRestaurantRequest,
): Promise<PlatformRestaurantDetail> {
  const { data } = await api.patch<PlatformRestaurantDetail>(restaurantPath(restaurantId), payload)
  return data
}

export async function addPlatformOwner(
  restaurantId: number,
  payload: PlatformOwnerRequest,
): Promise<PlatformOwner> {
  const { data } = await api.post<PlatformOwner>(restaurantPath(restaurantId, '/owners'), payload)
  return data
}

export function platformActivityQuery(params: PlatformActivityParams) {
  return queryOptions({
    queryKey: [...platformActivityQueryKey, params],
    queryFn: async () => {
      const { data } = await api.get<PlatformActivityPage>('/platform/activity', { params })
      return data
    },
  })
}

/** El local de muestra vigente y sus cuentas; `restaurant` es `null` si todavía no existe. */
export const platformSandboxQuery = queryOptions({
  queryKey: platformSandboxQueryKey,
  queryFn: async () => {
    const { data } = await api.get<PlatformSandbox>('/platform/sandbox')
    return data
  },
})

/** Archiva el local de muestra vigente (si hay) y crea uno nuevo con los datos de muestra. */
export async function resetPlatformSandbox(): Promise<PlatformSandbox> {
  const { data } = await api.post<PlatformSandbox>('/platform/sandbox/reset')
  return data
}

/**
 * Un código de un solo uso para entrar al local de muestra como su encargado
 * o su mesero. Vale `expires_in` segundos y lo canjea la pestaña nueva en
 * `POST /auth/preview`.
 */
export async function startPlatformPreview(payload: PreviewRequest): Promise<PreviewCodeResponse> {
  const { data } = await api.post<PreviewCodeResponse>('/platform/preview', payload)
  return data
}
