import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { aiDecisionsQueryKey, fetchRestock, refreshRestock, restockQueryKey } from '../../api/insights'

/** La recomendación de reposición y la acción de pedirla de nuevo. */
export function useRestock() {
  const queryClient = useQueryClient()
  const recomendacion = useQuery({ queryKey: restockQueryKey, queryFn: fetchRestock })
  const actualizar = useMutation({
    mutationFn: refreshRestock,
    onSuccess: async (data) => {
      queryClient.setQueryData(restockQueryKey, data)
      await queryClient.invalidateQueries({ queryKey: aiDecisionsQueryKey })
    },
  })
  return { recomendacion, actualizar }
}
