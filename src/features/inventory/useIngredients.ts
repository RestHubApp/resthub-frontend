import { useQuery } from '@tanstack/react-query'

import { fetchIngredients, ingredientsQueryKey } from '../../api/inventory'

/** Los insumos activos con su stock, que comparten la tabla, los filtros y el editor de recetas. */
export function useIngredients() {
  return useQuery({ queryKey: ingredientsQueryKey, queryFn: () => fetchIngredients() })
}
