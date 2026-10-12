import type { QueryKey } from '@tanstack/react-query'

import { restaurantQueryKey, updateRestaurant } from '@/api/restaurant'
import type { OwnRestaurant } from '@/api/types'
import { useNotifiedMutation } from './useNotifiedMutation'

interface RestaurantSettingOptions {
  /** El campo del local que se enciende o se apaga. */
  readonly field: 'external_ai_enabled' | 'auto_out_of_stock'
  /** El aviso de éxito, según cómo quedó el local. */
  readonly success: (updated: OwnRestaurant) => string
  readonly failure: string
  /** Lo que depende del ajuste y se relee de fondo. */
  readonly invalidate?: readonly QueryKey[]
}

/** Encender o apagar un ajuste del local: pone la respuesta en la caché y avisa. */
export function useRestaurantSetting({ field, success, failure, invalidate = [] }: RestaurantSettingOptions) {
  return useNotifiedMutation({
    mutationFn: (isActive: boolean) => updateRestaurant({ [field]: isActive }),
    success,
    failure,
    updateCache: (queryClient, updated) => {
      queryClient.setQueryData(restaurantQueryKey, updated)
    },
    invalidate,
  })
}
