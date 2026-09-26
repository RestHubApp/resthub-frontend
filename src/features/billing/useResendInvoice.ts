import { useMutation, useQueryClient } from '@tanstack/react-query'

import { billingQueryKey, resendInvoice } from '../../api/billing'
import { errorMessage } from '../../services/api'
import { useNotifications } from '../../store/notifications'

/** Reenviar un comprobante al proveedor y avisar cómo quedó. */
export function useResendInvoice() {
  const queryClient = useQueryClient()
  const push = useNotifications((state) => state.push)

  return useMutation({
    mutationFn: resendInvoice,
    onSuccess: (invoice) => {
      void queryClient.invalidateQueries({ queryKey: billingQueryKey })
      push({ tone: 'info', message: `${invoice.code}: ${invoice.status_label}.` })
    },
    onError: (error) => {
      push({ tone: 'warning', message: errorMessage(error, 'No se pudo reenviar.') })
    },
  })
}
