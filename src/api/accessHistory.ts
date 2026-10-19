import { queryOptions } from '@tanstack/react-query'

import { send } from './client'
import { staffQueryKey } from './staff'
import type { AccessHistoryPage } from './types'

// El historial de accesos (RFS-15): cada intento de entrar, con su resultado,
// el dispositivo, la red y el lugar. El servidor lo guarda 90 días.

/** Cuántos accesos se piden por vez; «Ver más» pide otra tanda. */
export const ACCESS_PAGE_SIZE = 10

export const ownAccessHistoryQueryKey = ['auth', 'access-history'] as const

/** Los últimos `limit` accesos de la cuenta propia. */
export function ownAccessHistoryQuery(limit: number) {
  return queryOptions({
    queryKey: [...ownAccessHistoryQueryKey, limit] as const,
    queryFn: (): Promise<AccessHistoryPage> =>
      send((client) => client.GET('/api/v1/auth/me/access-history', { params: { query: { limit, offset: 0 } } })),
  })
}

function staffAccessHistoryQueryKey(userId: number) {
  return [...staffQueryKey, 'access-history', userId] as const
}

/** Los últimos `limit` accesos de una cuenta del personal. */
export function staffAccessHistoryQuery(userId: number, limit: number) {
  return queryOptions({
    queryKey: [...staffAccessHistoryQueryKey(userId), limit] as const,
    queryFn: (): Promise<AccessHistoryPage> =>
      send((client) =>
        client.GET('/api/v1/staff/{user_id}/access-history', { params: { path: { user_id: userId }, query: { limit, offset: 0 } } }),
      ),
  })
}
