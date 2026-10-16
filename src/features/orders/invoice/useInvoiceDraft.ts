import { useState } from 'react'

import type { DocumentType, InvoiceKind, IssueInvoiceRequest } from '@/api/types'
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
 * El borrador de un comprobante: tipo, documento y datos del cliente, para un
 * pedido de `total` (texto decimal del API). Lo usan la emisión y el cambio de
 * un comprobante anulado por otro.
 */
export function useInvoiceDraft(total: string, initialKind: InvoiceKind = 'boleta') {
  const [kind, setKind] = useState<InvoiceKind>(initialKind)
  const [doc, setDoc] = useState<DocumentType>('none')
  const [customer, setCustomer] = useState<InvoiceCustomer>(EMPTY_CUSTOMER)
  const totalCents = toCents(total)
  const type = effectiveDocument(kind, doc, totalCents)

  return {
    kind,
    setKind,
    setDoc,
    customer,
    setCustomer,
    totalCents,
    type,
    isComplete: customerComplete(type, customer.number, customer.name),
    /** El cuerpo de la emisión para el pedido `orderId`, con los datos sin espacios de más. */
    request: (orderId: number): IssueInvoiceRequest => ({
      order_id: orderId,
      kind,
      customer_document_type: type,
      customer_document_number: customer.number.trim(),
      customer_name: customer.name.trim(),
      customer_address: customer.address.trim(),
    }),
  }
}

export type InvoiceDraft = ReturnType<typeof useInvoiceDraft>
