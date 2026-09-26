import { infiniteQueryOptions, queryOptions } from '@tanstack/react-query'

import { api } from '../services/api'
import type {
  ObsLogDetail,
  ObsLogPage,
  ObsLogsParams,
  ObsRequestPage,
  ObsRequestsParams,
  ObsRoutesParams,
  ObsRouteStats,
  ObsStatusCount,
  ObsSummary,
  ObsTimeseries,
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

const BASE = '/platform/observability'

/** Lo que se pide por página de logs o de peticiones. */
export const OBS_PAGE_SIZE = 50

/** El `before_id` de la primera página: ninguno, empieza por lo más nuevo. */
const FIRST_PAGE: number | null = null

async function read<T>(path: string, params: object): Promise<T> {
  const { data } = await api.get<T>(`${BASE}${path}`, { params })
  return data
}

export function obsSummaryQuery(params: ObsWindowParams) {
  return queryOptions({
    queryKey: [...platformObservabilityQueryKey, 'summary', params],
    queryFn: () => read<ObsSummary>('/summary', params),
  })
}

export function obsTimeseriesQuery(params: ObsWindowParams) {
  return queryOptions({
    queryKey: [...platformObservabilityQueryKey, 'timeseries', params],
    queryFn: () => read<ObsTimeseries>('/timeseries', params),
  })
}

export function obsRoutesQuery(params: ObsRoutesParams) {
  return queryOptions({
    queryKey: [...platformObservabilityQueryKey, 'routes', params],
    queryFn: () => read<ObsRouteStats[]>('/routes', params),
  })
}

export function obsStatusQuery(params: ObsWindowParams) {
  return queryOptions({
    queryKey: [...platformObservabilityQueryKey, 'status', params],
    queryFn: () => read<ObsStatusCount[]>('/status', params),
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
      read<ObsLogPage>('/logs', { ...params, limit: OBS_PAGE_SIZE, before_id: pageParam ?? undefined }),
    initialPageParam: FIRST_PAGE,
    getNextPageParam: (last) => last.next_before_id,
  })
}

export function obsLogQuery(entryId: number) {
  return queryOptions({
    queryKey: [...platformObservabilityQueryKey, 'log', entryId],
    queryFn: () => read<ObsLogDetail>(`/logs/${String(entryId)}`, {}),
  })
}

/** Las peticiones una por una, paginadas igual que los logs. */
export function obsRequestsQuery(params: Omit<ObsRequestsParams, 'before_id' | 'limit'>) {
  return infiniteQueryOptions({
    queryKey: [...platformObservabilityQueryKey, 'requests', params],
    queryFn: ({ pageParam }) =>
      read<ObsRequestPage>('/requests', { ...params, limit: OBS_PAGE_SIZE, before_id: pageParam ?? undefined }),
    initialPageParam: FIRST_PAGE,
    getNextPageParam: (last) => last.next_before_id,
  })
}
