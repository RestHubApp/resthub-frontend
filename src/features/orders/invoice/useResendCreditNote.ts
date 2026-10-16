import { useMutation, useQueryClient } from '@tanstack/react-query'

import { billingQueryKey, orderInvoiceQueryKey, resendCreditNote } from '@/api/billing'
import { billingErrorMessage } from '@/services/billingErrors'
import { useNotifications } from '@/store/notifications'
import { voidOutcome } from './invoiceVoid'

/** Reenvía la nota de crédito y avisa si el comprobante ya quedó anulado. */
export function useResendCreditNote() {
  const queryClient = useQueryClient()
  const push = useNotifications((state) => state.push)

  return useMutation({
    mutationFn: resendCreditNote,
    onSuccess: (invoice) => {
      queryClient.setQueryData(orderInvoiceQueryKey(invoice.order_id), invoice)
      push(voidOutcome(invoice, null))
    },
    onError: (error) => {
      push({ tone: 'warning', message: billingErrorMessage(error, 'No se pudo reenviar la nota de crédito.') })
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: billingQueryKey }),
  })
}
