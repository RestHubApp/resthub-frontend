import type { Invoice } from '@/api/types'
import { formatDateTime, formatMoney } from '@/services/format'
import { InvoiceRowActions } from './InvoiceRowActions'
import type { InvoiceSlot } from './invoiceSlot'

interface InvoiceRowProps {
  readonly invoice: Invoice
  readonly timeZone: string
  readonly resending: boolean
  readonly onResend: () => void
  readonly Slot?: InvoiceSlot | undefined
}

/** Un comprobante emitido: número, monto, cliente, estado (o la anulación) y qué se puede hacer. */
export function InvoiceRow({ invoice, timeZone, resending, onResend, Slot }: InvoiceRowProps) {
  return (
    <li className="flex flex-wrap items-center justify-between gap-2 rounded-lg px-3 py-2 ring-1 ring-input">
      <span className="flex flex-col">
        <span className="font-medium">
          {invoice.code} · {formatMoney(invoice.total)}
        </span>
        <span className="text-xs text-muted-foreground">
          {invoice.customer_name} · {formatDateTime(invoice.issued_at, timeZone)} · {invoice.is_voided ? 'Anulado' : invoice.status_label}
        </span>
        {invoice.status === 'rejected' && invoice.provider_message !== '' && !invoice.is_voided ? (
          <span className="text-xs text-destructive">{invoice.provider_message}</span>
        ) : null}
      </span>
      <InvoiceRowActions invoice={invoice} resending={resending} onResend={onResend} />
      {Slot === undefined ? null : <Slot invoice={invoice} />}
    </li>
  )
}
