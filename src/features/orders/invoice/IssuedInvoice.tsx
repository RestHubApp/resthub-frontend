import type { Invoice } from '@/api/types'
import { InvoiceDownloads } from '@/components/InvoiceDownloads'
import { InvoiceVoidState } from './InvoiceVoidState'
import { ValidInvoice } from './ValidInvoice'

/**
 * Un comprobante ya emitido: su número, cómo lo recibió SUNAT (con el motivo
 * tal cual si lo rechazó), sus archivos, cómo enviarlo o imprimirlo y cómo
 * cambiarlo o anularlo. Anulado, muestra el motivo y su nota de crédito, y ya
 * no se envía ni se imprime.
 */
export function IssuedInvoice({ invoice }: { readonly invoice: Invoice }) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg px-4 py-3 text-sm ring-1 ring-input">
      <span className="font-semibold">{invoice.kind_label} {invoice.code}</span>
      {invoice.is_voided ? <InvoiceVoidState invoice={invoice} /> : <ValidInvoice invoice={invoice} />}
      {invoice.is_voided ? <InvoiceDownloads invoice={invoice} /> : null}
    </div>
  )
}
