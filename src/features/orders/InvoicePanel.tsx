import { useQuery } from '@tanstack/react-query'

import { orderInvoiceQuery } from '@/api/billing'
import { PERMISSION } from '@/api/permissions'
import type { Invoice, OrderResponse } from '@/api/types'
import { RetryQueryError } from '@/components/RetryQueryError'
import { useCan } from '@/store/session'
import { IssuedInvoice } from '@/features/orders/invoice/IssuedInvoice'
import { IssueInvoiceButton } from '@/features/orders/invoice/IssueInvoiceButton'

/** Sin comprobante, o con el vigente anulado, se puede emitir uno. */
function isIssuable(issued: Invoice | null): boolean {
  return issued === null || issued.is_voided
}

interface InvoicePanelProps {
  readonly order: OrderResponse
}

/**
 * El comprobante electrónico de un pedido pagado: emitirlo o verlo.
 *
 * Aparece solo con el pedido pagado y para quien puede emitir. Ya emitido,
 * muestra el número, cómo lo recibió SUNAT, sus archivos y cómo enviarlo. Si el
 * vigente se anuló, lo muestra anulado y vuelve a ofrecer emitir otro.
 */
export function InvoicePanel({ order }: InvoicePanelProps) {
  const can = useCan(PERMISSION.billingIssue)
  const isShown = can && order.status === 'paid'
  const invoice = useQuery({ ...orderInvoiceQuery(order.id), enabled: isShown })
  if (!isShown || invoice.isPending) {
    return null
  }
  // Sin saber si ya tiene comprobante, no se ofrece emitir otro.
  if (invoice.isError) {
    return (
      <RetryQueryError
        error={invoice.error}
        fallback="No se pudo saber si el pedido ya tiene comprobante."
        onRetry={() => {
          void invoice.refetch()
        }}
      />
    )
  }
  const issued = invoice.data ?? null

  return (
    <>
      {issued === null ? null : <IssuedInvoice invoice={issued} />}
      {isIssuable(issued) ? <IssueInvoiceButton order={order} /> : null}
    </>
  )
}
