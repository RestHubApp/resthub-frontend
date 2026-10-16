import { useNavigate } from 'react-router'

import { openStockCount, stockCountListsQueryKey, stockCountQueryKey } from '@/api/stockCounts'
import type { OpenStockCountRequest } from '@/api/types'
import { paths } from '@/services/paths'
import { useNotifiedMutation } from '@/store/useNotifiedMutation'

/**
 * Abre un conteo y lleva a su lista para contar. Si ya había uno en curso
 * (lo abrió otra persona), la pestaña se relee para mostrarlo.
 */
export function useStartCount() {
  const navigate = useNavigate()
  return useNotifiedMutation({
    mutationFn: (payload: OpenStockCountRequest) => openStockCount(payload),
    success: (count) => `Conteo #${String(count.number)} iniciado: ${String(count.total_lines)} insumos para contar.`,
    updateCache: (queryClient, count) => {
      queryClient.setQueryData(stockCountQueryKey(count.id), count)
    },
    invalidate: [stockCountListsQueryKey],
    invalidateOnError: [stockCountListsQueryKey],
    onSuccess: (count) => {
      void navigate(paths.inventory.count(count.id))
    },
  })
}
