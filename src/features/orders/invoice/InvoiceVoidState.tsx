import type { Invoice } from '@/api/types'
import { CreditNoteStatus } from './CreditNoteStatus'
import { ReplacedInvoice } from './ReplacedInvoice'

/**
 * Lo que la anulación dejó en un comprobante: «Anulado: <motivo>», su nota de
 * crédito (aceptada o en curso) y, en el que vino a reemplazarlo, a cuál
 * reemplaza.
 */
export function InvoiceVoidState({ invoice }: { readonly invoice: Invoice }) {
  return (
    <>
      {invoice.is_voided ? (
        <p className="m-0 basis-full text-sm font-medium text-destructive">Anulado: {invoice.void_reason}</p>
      ) : null}
      {invoice.credit_note === null ? null : <CreditNoteStatus note={invoice.credit_note} isVoided={invoice.is_voided} />}
      {invoice.replaces_invoice_id === null ? null : <ReplacedInvoice invoiceId={invoice.replaces_invoice_id} />}
    </>
  )
}
