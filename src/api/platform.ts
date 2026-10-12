import { queryOptions } from '@tanstack/react-query'

import { PLATFORM_QUERY_ROOT } from '@/services/queryClient'
import { send } from './client'
import type {
  CreatePlatformRestaurantRequest,
  PlatformActivityParams,
  PlatformOwner,
  PlatformOwnerRequest,
  PlatformRestaurantDetail,
  PlatformRestaurantListParams,
  PlatformSandbox,
  PreviewCodeResponse,
  PreviewRequest,
  UpdatePlatformRestaurantRequest,
} from './types'

// El administrador del sistema: el equipo de RestHub, que da de alta los
// restaurantes y los activa o desactiva. Todas sus rutas van bajo `/platform`
// y cada una exige un permiso `platform.*`. Entra por el mismo acceso que el
// personal (`api/auth`): la sesión es una sola.

export const platformQueryKey = [PLATFORM_QUERY_ROOT] as const
export const platformRestaurantsQueryKey = [...platformQueryKey, 'restaurants'] as const
export const platformActivityQueryKey = [...platformQueryKey, 'activity'] as const
export const platformSandboxQueryKey = [...platformQueryKey, 'sandbox'] as const

// Las escrituras llevan la misma raíz, por orden: el caché de mutaciones guarda
// lo enviado y se vacía entero al cerrar la sesión.
export const platformMutationKeys = {
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

export function platformRestaurantsQuery(params: PlatformRestaurantListParams) {
  return queryOptions({
    queryKey: [...platformRestaurantsQueryKey, 'list', params],
    queryFn: () => send((client) => client.GET('/api/v1/platform/restaurants', { params: { query: params } })),
  })
}

export function platformRestaurantQueryKey(restaurantId: number) {
  return [...platformRestaurantsQueryKey, 'detail', restaurantId] as const
}

export function platformRestaurantQuery(restaurantId: number) {
  return queryOptions({
    queryKey: platformRestaurantQueryKey(restaurantId),
    queryFn: () =>
      send((client) =>
        client.GET('/api/v1/platform/restaurants/{restaurant_id}', {
          params: { path: { restaurant_id: restaurantId } },
        }),
      ),
  })
}

/** Crea el restaurante, sus roles base y su primer encargado en una sola operación. */
export async function createPlatformRestaurant(
  payload: CreatePlatformRestaurantRequest,
): Promise<PlatformRestaurantDetail> {
  return send((client) => client.POST('/api/v1/platform/restaurants', { body: payload }))
}

/** Nombre, zona horaria o estado. Desactivar corta al instante el acceso de su personal entero. */
export async function updatePlatformRestaurant(
  restaurantId: number,
  payload: UpdatePlatformRestaurantRequest,
): Promise<PlatformRestaurantDetail> {
  return send((client) =>
    client.PATCH('/api/v1/platform/restaurants/{restaurant_id}', {
      params: { path: { restaurant_id: restaurantId } },
      body: payload,
    }),
  )
}

export async function addPlatformOwner(
  restaurantId: number,
  payload: PlatformOwnerRequest,
): Promise<PlatformOwner> {
  return send((client) =>
    client.POST('/api/v1/platform/restaurants/{restaurant_id}/owners', {
      params: { path: { restaurant_id: restaurantId } },
      body: payload,
    }),
  )
}

export function platformActivityQuery(params: PlatformActivityParams) {
  return queryOptions({
    queryKey: [...platformActivityQueryKey, params],
    queryFn: () => send((client) => client.GET('/api/v1/platform/activity', { params: { query: params } })),
  })
}

/** El local de muestra vigente y sus cuentas; `restaurant` es `null` si todavía no existe. */
export const platformSandboxQuery = queryOptions({
  queryKey: platformSandboxQueryKey,
  queryFn: () => send((client) => client.GET('/api/v1/platform/sandbox')),
})

/** Archiva el local de muestra vigente (si hay) y crea uno nuevo con los datos de muestra. */
export async function resetPlatformSandbox(): Promise<PlatformSandbox> {
  return send((client) => client.POST('/api/v1/platform/sandbox/reset'))
}

/**
 * Un código de un solo uso para entrar al local de muestra como su encargado
 * o su mesero. Vale `expires_in` segundos y lo canjea la pestaña nueva en
 * `POST /auth/preview`.
 */
export async function startPlatformPreview(payload: PreviewRequest): Promise<PreviewCodeResponse> {
  return send((client) => client.POST('/api/v1/platform/preview', { body: payload }))
}
