import { queryOptions } from '@tanstack/react-query'

import { api } from '../services/api'
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
  PlatformTokenResponse,
  UpdatePlatformRestaurantRequest,
} from './platformTypes'

// El administrador del sistema: el equipo de RestHub, que da de alta los
// restaurantes y los activa o desactiva. Todas sus rutas van bajo
// `/platform`, y el cliente HTTP les pone el token de esa sesión y nunca el
// de un restaurante.

/**
 * La raíz de todas las claves de plataforma. Cerrar una sesión de restaurante
 * vacía el caché salvo esto, y cerrar la de plataforma vacía solo esto.
 */
export const PLATFORM_QUERY_ROOT = 'platform'

export const platformQueryKey = [PLATFORM_QUERY_ROOT] as const
export const platformRestaurantsQueryKey = [...platformQueryKey, 'restaurants'] as const

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
    queryKey: [...platformQueryKey, 'activity', params],
    queryFn: async () => {
      const { data } = await api.get<PlatformActivityPage>('/platform/activity', { params })
      return data
    },
  })
}
