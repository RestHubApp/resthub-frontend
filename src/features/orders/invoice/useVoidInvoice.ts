import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

import { billingQueryKey, issueInvoice, orderInvoiceQueryKey, voidInvoice } from '@/api/billing'
import type { Invoice, IssueInvoiceRequest } from '@/api/types'
import { useNotifications } from '@/store/notifications'
import { voidOutcome } from './invoiceVoid'

interface VoidRequest {
  readonly reason: string
  /** El comprobante nuevo, al cambiarlo; `null` para solo anular. */
  readonly reissue: IssueInvoiceRequest | null
}

interface VoidResult {
  readonly voided: Invoice
  readonly issued: Invoice | null
}

/**
 * Anula el comprobante y, si se pidió, emite el nuevo del mismo pedido.
 *
 * No hay una operación que haga las dos cosas: primero se anula y, solo si
 * quedó anulado (sin nota de crédito en curso), se emite. Si la emisión falla,
 * el anulado se recuerda y el reintento solo emite. Al terminar se avisa cómo
 * quedó y se cierra con `onDone`.
 */
export function useVoidInvoice(invoice: Invoice, onDone: () => void) {
  const queryClient = useQueryClient()
  const push = useNotifications((state) => state.push)
  const [voided, setVoided] = useState<Invoice | null>(null)
  const mutation = useMutation({
    mutationFn: async ({ reason, reissue }: VoidRequest): Promise<VoidResult> => {
      const done = voided ?? (await voidInvoice(invoice.id, reason))
      setVoided(done)
      if (!done.is_voided || reissue === null) {
        return { voided: done, issued: null }
      }
      return { voided: done, issued: await issueInvoice(reissue) }
    },
    // También si falló: ya anulado, o con el pedido facturado mientras tanto, se relee.
    onSettled: () => queryClient.invalidateQueries({ queryKey: billingQueryKey }),
    onSuccess: (result) => {
      queryClient.setQueryData(orderInvoiceQueryKey(invoice.order_id), result.issued ?? result.voided)
      push(voidOutcome(result.voided, result.issued))
      onDone()
    },
  })
  return { mutation, voided }
}
