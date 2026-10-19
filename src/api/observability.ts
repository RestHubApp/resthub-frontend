import { infiniteQueryOptions, queryOptions } from '@tanstack/react-query'

import { send } from './client'
import type {
  ObsLogsParams,
  ObsRequestsParams,
  ObsRoutesParams,
  ObsWindowParams,
} from './types'
import { platformQueryKey } from './platform'

// El panel de observabilidad del administrador del sistema: tráfico, errores,
// latencias y logs que el propio backend guarda de sí mismo. Va bajo
// `/platform`, así que viaja con el token de plataforma y sus claves cuelgan
// de la misma raíz: cerrar esa sesión las saca del caché.
//
// `restaurant_id` va como filtro a propósito, igual que las rutas
// `/platform/restaurants/{id}`: la plataforma mira a todos los locales. La
// regla de no mandarlo es de la sesión de un restaurante, que nunca llega acá.

export const platformObservabilityQueryKey = [...platformQueryKey, 'observability'] as const

/** Lo que se pide por página de logs o de peticiones. */
const OBS_PAGE_SIZE = 50

/** Lo que se pide de una página: el tamaño y, desde la segunda, lo anterior al último que se ve. */
function pageOf(beforeId: number | null) {
  return beforeId === null ? { limit: OBS_PAGE_SIZE } : { limit: OBS_PAGE_SIZE, before_id: beforeId }
}

/** El `before_id` de la primera página: ninguno, empieza por lo más nuevo. */
const FIRST_PAGE: number | null = null

export function obsSummaryQuery(params: ObsWindowParams) {
  return queryOptions({
    queryKey: [...platformObservabilityQueryKey, 'summary', params],
    queryFn: () => send((client) => client.GET('/api/v1/platform/observability/summary', { params: { query: params } })),
  })
}

export function obsTimeseriesQuery(params: ObsWindowParams) {
  return queryOptions({
    queryKey: [...platformObservabilityQueryKey, 'timeseries', params],
    queryFn: () => send((client) => client.GET('/api/v1/platform/observability/timeseries', { params: { query: params } })),
  })
}

export function obsRoutesQuery(params: ObsRoutesParams) {
  return queryOptions({
    queryKey: [...platformObservabilityQueryKey, 'routes', params],
    queryFn: () => send((client) => client.GET('/api/v1/platform/observability/routes', { params: { query: params } })),
  })
}

export function obsStatusQuery(params: ObsWindowParams) {
  return queryOptions({
    queryKey: [...platformObservabilityQueryKey, 'status', params],
    queryFn: () => send((client) => client.GET('/api/v1/platform/observability/status', { params: { query: params } })),
  })
}

/**
 * Los logs, de los más nuevos a los más viejos, por páginas de clave: cada
 * «Cargar más» pide lo anterior al último que se ve (`before_id`), así una
 * entrada nueva no corre la lista ni repite filas.
 */
export function obsLogsQuery(params: Omit<ObsLogsParams, 'before_id' | 'limit'>) {
  return infiniteQueryOptions({
    queryKey: [...platformObservabilityQueryKey, 'logs', params],
    queryFn: ({ pageParam }) =>
      send((client) =>
        client.GET('/api/v1/platform/observability/logs', {
          params: { query: { ...params, ...pageOf(pageParam) } },
        }),
      ),
    initialPageParam: FIRST_PAGE,
    getNextPageParam: (last) => last.next_before_id,
  })
}

export function obsLogQuery(entryId: number) {
  return queryOptions({
    queryKey: [...platformObservabilityQueryKey, 'log', entryId],
    queryFn: () =>
      send((client) =>
        client.GET('/api/v1/platform/observability/logs/{entry_id}', { params: { path: { entry_id: entryId } } }),
      ),
  })
}

/** Las peticiones una por una, paginadas igual que los logs. */
export function obsRequestsQuery(params: Omit<ObsRequestsParams, 'before_id' | 'limit'>) {
  return infiniteQueryOptions({
    queryKey: [...platformObservabilityQueryKey, 'requests', params],
    queryFn: ({ pageParam }) =>
      send((client) =>
        client.GET('/api/v1/platform/observability/requests', {
          params: { query: { ...params, ...pageOf(pageParam) } },
        }),
      ),
    initialPageParam: FIRST_PAGE,
    getNextPageParam: (last) => last.next_before_id,
  })
}

/** Los últimos picos de accesos fallidos, bloqueos o 403 que pasaron su umbral (RFS-31). */
export function obsSecurityAlertsQuery() {
  return queryOptions({
    queryKey: [...platformObservabilityQueryKey, 'security-alerts'],
    queryFn: () => send((client) => client.GET('/api/v1/platform/observability/security-alerts')),
  })
}
