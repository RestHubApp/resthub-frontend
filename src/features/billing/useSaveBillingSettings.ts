import { useMutation, useQueryClient } from '@tanstack/react-query'

import { billingQueryKey, billingSettingsQueryKey, updateBillingSettings } from '@/api/billing'
import { useNotifications } from '@/store/notifications'
import { requestOf, type SettingsValues } from './billingSettingsSchema'

/** Guarda los datos fiscales y deja a la vista lo que devolvió el servidor. */
export function useSaveBillingSettings(onSaved: (() => void) | undefined) {
  const queryClient = useQueryClient()
  const push = useNotifications((state) => state.push)
  return useMutation({
    mutationFn: (values: SettingsValues) => updateBillingSettings(requestOf(values)),
    onSuccess: (saved) => {
      queryClient.setQueryData(billingSettingsQueryKey, saved)
      void queryClient.invalidateQueries({ queryKey: billingQueryKey })
      push({ tone: 'info', message: 'Datos fiscales guardados.' })
      onSaved?.()
    },
  })
}
