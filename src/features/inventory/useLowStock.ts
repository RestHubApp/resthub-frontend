import { useQuery } from '@tanstack/react-query'

import { fetchLowStock, lowStockQueryKey } from '../../api/inventory'

/** Los insumos bajo su mínimo, negativos incluidos. */
export function useLowStock() {
  return useQuery({ queryKey: lowStockQueryKey, queryFn: fetchLowStock })
}
