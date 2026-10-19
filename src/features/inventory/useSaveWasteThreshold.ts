import { restaurantQueryKey, updateRestaurant } from '@/api/restaurant'
import { formatMoney } from '@/services/format'
import { useNotifiedMutation } from '@/store/useNotifiedMutation'

/** Guarda el monto de aprobación de mermas (`null` la apaga) y pone el local devuelto en la caché. */
export function useSaveWasteThreshold(onSaved: () => void) {
  return useNotifiedMutation({
    mutationFn: (threshold: string | null) => updateRestaurant({ waste_approval_threshold: threshold }),
    success: (updated) =>
      updated.waste_approval_threshold === null
        ? 'Las mermas ya no piden aprobación.'
        : `Las mermas de más de ${formatMoney(updated.waste_approval_threshold)} piden aprobación.`,
    updateCache: (queryClient, updated) => {
      queryClient.setQueryData(restaurantQueryKey, updated)
    },
    onSuccess: onSaved,
  })
}
