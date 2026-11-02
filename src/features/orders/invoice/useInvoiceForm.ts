import { useMutation, useQueryClient } from '@tanstack/react-query'

import { billingQueryKey, issueInvoice, orderInvoiceQueryKey } from '@/api/billing'
import type { IssueInvoiceRequest, OrderResponse } from '@/api/types'
import { hasCode, isUnreachable } from '@/services/apiError'
import { useInvoiceDraft } from './useInvoiceDraft'

/**
 * El comprobante de un pedido: el borrador y su emisión.
 *
 * `issue` emite el comprobante; al lograrlo refresca la facturación y llama a
 * `onClose` para cerrar el diálogo.
 */
export function useInvoiceForm(order: OrderResponse, onClose: () => void) {
  const draft = useInvoiceDraft(order.total)
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: (payload: IssueInvoiceRequest) => issueInvoice(payload),
    onSuccess: (invoice) => {
      queryClient.setQueryData(orderInvoiceQueryKey(order.id), invoice)
      void queryClient.invalidateQueries({ queryKey: billingQueryKey })
      onClose()
    },
    // Sin respuesta, o con «ya tiene comprobante», puede que sí se haya emitido:
    // se relee el del pedido para mostrarlo en vez de seguir ofreciendo emitir.
    onError: (error) => {
      if (hasCode(error, 'order_already_invoiced') || isUnreachable(error)) {
        void queryClient.invalidateQueries({ queryKey: orderInvoiceQueryKey(order.id) })
      }
    },
  })

  return {
    draft,
    mutation,
    canIssue: !mutation.isPending && draft.isComplete,
    issue: () => {
      mutation.mutate(draft.request(order.id))
    },
  }
}
