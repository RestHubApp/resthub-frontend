import { CustomerFields } from './CustomerFields'
import { InvoiceDocumentSelect } from './InvoiceDocumentSelect'
import { InvoiceKindPicker } from './InvoiceKindPicker'
import type { InvoiceDraft } from './useInvoiceDraft'

/** Boleta o factura, el documento del cliente y sus datos. */
export function InvoiceDraftFields({ draft }: { readonly draft: InvoiceDraft }) {
  const { kind, type } = draft
  return (
    <>
      <InvoiceKindPicker kind={kind} onChange={draft.setKind} />
      <InvoiceDocumentSelect kind={kind} totalCents={draft.totalCents} value={type} onChange={draft.setDoc} />
      <CustomerFields documentType={type} withAddress={kind === 'factura'} values={draft.customer} onChange={draft.setCustomer} />
    </>
  )
}
