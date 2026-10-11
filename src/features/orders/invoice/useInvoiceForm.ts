import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

import { billingQueryKey, issueInvoice, orderInvoiceQueryKey } from '@/api/billing'
import type { DocumentType, InvoiceKind, IssueInvoiceRequest, OrderResponse } from '@/api/types'
import { toCents } from '@/services/format'
import { customerComplete, effectiveDocument } from './invoiceDocument'

/** Los datos del cliente que se escriben para el comprobante. */
export interface InvoiceCustomer {
  readonly number: string
  readonly name: string
  readonly address: string
}

const EMPTY_CUSTOMER: InvoiceCustomer = { number: '', name: '', address: '' }

/**
 * El borrador del comprobante de un pedido: tipo, documento y datos del cliente.
 *
 * `issue` emite el comprobante; al lograrlo refresca la facturación y llama a
 * `onClose` para cerrar el diálogo.
 */
export function useInvoiceForm(order: OrderResponse, onClose: () => void) {
  const [kind, setKind] = useState<InvoiceKind>('boleta')
  const [doc, setDoc] = useState<DocumentType>('none')
  const [customer, setCustomer] = useState<InvoiceCustomer>(EMPTY_CUSTOMER)
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: (payload: IssueInvoiceRequest) => issueInvoice(payload),
    onSuccess: (invoice) => {
      queryClient.setQueryData(orderInvoiceQueryKey(order.id), invoice)
      void queryClient.invalidateQueries({ queryKey: billingQueryKey })
      onClose()
    },
  })
  const total = toCents(order.total)
  const type = effectiveDocument(kind, doc, total)

  return {
    kind,
    setKind,
    setDoc,
    customer,
    setCustomer,
    total,
    type,
    mutation,
    canIssue: !mutation.isPending && customerComplete(type, customer.number, customer.name),
    issue: () => {
      mutation.mutate({
        order_id: order.id,
        kind,
        customer_document_type: type,
        customer_document_number: customer.number.trim(),
        customer_name: customer.name.trim(),
        customer_address: customer.address.trim(),
      })
    },
  }
}
