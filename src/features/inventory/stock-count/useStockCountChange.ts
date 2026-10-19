import type { QueryKey } from '@tanstack/react-query'

import { stockCountListsQueryKey, stockCountQueryKey } from '@/api/stockCounts'
import type { StockCount } from '@/api/types'
import { useNotifiedMutation } from '@/store/useNotifiedMutation'

interface StockCountChange<TVars> {
  readonly send: (vars: TVars) => Promise<StockCount>
  /** El aviso de éxito; sin él, el cambio se ve en la pantalla y basta. */
  readonly success?: (count: StockCount) => string
  /** Lo que además se relee de fondo (cerrar el conteo mueve el stock). */
  readonly invalidate?: readonly QueryKey[]
  readonly onSuccess?: (count: StockCount) => void
}

/**
 * Un cambio en un conteo: la pantalla muestra el conteo que devolvió el
 * servidor y las listas se releen de fondo. Si falla (otro lo cerró, por
 * ejemplo), el conteo se relee para no mostrar un estado viejo.
 */
export function useStockCountChange<TVars>(countId: number, { send, success, invalidate = [], onSuccess }: StockCountChange<TVars>) {
  return useNotifiedMutation({
    mutationFn: send,
    ...(success === undefined ? {} : { success }),
    updateCache: (queryClient, count) => {
      queryClient.setQueryData(stockCountQueryKey(count.id), count)
    },
    invalidate: [stockCountListsQueryKey, ...invalidate],
    invalidateOnError: [stockCountQueryKey(countId), stockCountListsQueryKey],
    ...(onSuccess === undefined ? {} : { onSuccess }),
  })
}
