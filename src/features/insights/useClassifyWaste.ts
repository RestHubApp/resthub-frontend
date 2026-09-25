import { useMutation, useQueryClient } from '@tanstack/react-query'

import { aiDecisionsQueryKey, classifyWaste, insightsQueryKey } from '../../api/insights'

export const WASTE_REPORT = 'waste'

/** Pide a la IA el motivo de las mermas pendientes y refresca el desglose. */
export function useClassifyWaste() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: classifyWaste,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: [...insightsQueryKey, WASTE_REPORT] }),
        queryClient.invalidateQueries({ queryKey: aiDecisionsQueryKey }),
      ])
    },
  })
}
