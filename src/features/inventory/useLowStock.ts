import { useQuery } from '@tanstack/react-query'

import { lowStockQuery } from '../../api/inventory'

/** Los insumos bajo su mínimo, negativos incluidos. */
export function useLowStock() {
  return useQuery(lowStockQuery)
}
