import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { aiDecisionsQueryKey, refreshRestock, restockQuery } from '@/api/insights'

/** La recomendación de reposición y la acción de pedirla de nuevo. */
export function useRestock() {
  const queryClient = useQueryClient()
  const recommendation = useQuery(restockQuery)
  const update = useMutation({
    mutationFn: refreshRestock,
    onSuccess: async (data) => {
      queryClient.setQueryData(restockQuery.queryKey, data)
      await queryClient.invalidateQueries({ queryKey: aiDecisionsQueryKey })
    },
  })
  return { recommendation, update }
}
