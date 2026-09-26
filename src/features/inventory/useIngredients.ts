import { useQuery } from '@tanstack/react-query'

import { ingredientsQuery } from '../../api/inventory'

/** Los insumos activos con su stock, que comparten la tabla, los filtros y el editor de recetas. */
export function useIngredients() {
  return useQuery(ingredientsQuery)
}
