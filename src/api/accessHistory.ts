import { infiniteQueryOptions } from '@tanstack/react-query'

import { send } from './client'
import { staffQueryKey } from './staff'
import type { AccessHistoryPage } from './types'

// El historial de accesos (RFS-15): cada intento de entrar, con su resultado,
// el dispositivo, la red y el lugar. El servidor lo guarda 90 días.

/**
 * Cuántos accesos se piden por vez; «Ver más» pide la tanda siguiente por
 * `offset`. El tamaño no crece: el servidor no acepta un `limit` mayor que 100.
 */
const ACCESS_PAGE_SIZE = 10

export const ownAccessHistoryQueryKey = ['auth', 'access-history'] as const

// La tanda siguiente empieza donde terminan las ya cargadas; sin más, no hay otra.
function nextAccessOffset(last: AccessHistoryPage, pages: readonly AccessHistoryPage[]): number | undefined {
  const loaded = pages.reduce((count, page) => count + page.items.length, 0)
  return last.items.length > 0 && loaded < last.total ? loaded : undefined
}

/** Los accesos de la cuenta propia, del más reciente al más viejo, de a una tanda. */
export function ownAccessHistoryQuery() {
  return infiniteQueryOptions({
    queryKey: ownAccessHistoryQueryKey,
    queryFn: ({ pageParam }): Promise<AccessHistoryPage> =>
      send((client) =>
        client.GET('/api/v1/auth/me/access-history', { params: { query: { limit: ACCESS_PAGE_SIZE, offset: pageParam } } }),
      ),
    initialPageParam: 0,
    getNextPageParam: nextAccessOffset,
  })
}

function staffAccessHistoryQueryKey(userId: number) {
  return [...staffQueryKey, 'access-history', userId] as const
}

/** Los accesos de una cuenta del personal, del más reciente al más viejo, de a una tanda. */
export function staffAccessHistoryQuery(userId: number) {
  return infiniteQueryOptions({
    queryKey: staffAccessHistoryQueryKey(userId),
    queryFn: ({ pageParam }): Promise<AccessHistoryPage> =>
      send((client) =>
        client.GET('/api/v1/staff/{user_id}/access-history', {
          params: { path: { user_id: userId }, query: { limit: ACCESS_PAGE_SIZE, offset: pageParam } },
        }),
      ),
    initialPageParam: 0,
    getNextPageParam: nextAccessOffset,
  })
}
