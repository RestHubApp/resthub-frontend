import { queryOptions } from '@tanstack/react-query'

import { send } from './client'
import type { ActivityParams } from './types'

// La bitácora del restaurante: quién hizo qué y cuándo.

export const activityQueryKey = ['activity'] as const

/** Cuántos movimientos trae cada página de la bitácora. */
export const ACTIVITY_PAGE_SIZE = 25

export function activityQuery(params: ActivityParams) {
  return queryOptions({
    queryKey: [...activityQueryKey, params],
    queryFn: () => send((client) => client.GET('/api/v1/activity', { params: { query: params } })),
  })
}
