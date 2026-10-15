import { Link } from 'react-router'

import type { Invoice } from '@/api/types'
import { InvoiceDownloads } from '@/components/InvoiceDownloads'
import { Button } from '@/components/ui/button'
import { formatDateTime, formatMoney } from '@/services/format'
import { paths } from '@/services/paths'
import { InvoiceArchiveStatus } from './InvoiceArchiveStatus'

interface InvoiceRowProps {
  readonly invoice: Invoice
  readonly timeZone: string
  readonly resending: boolean
  readonly onResend: () => void
}

/** Un comprobante emitido: número, monto, cliente, estado y qué se puede hacer. */
export function InvoiceRow({ invoice, timeZone, resending, onResend }: InvoiceRowProps) {
  return (
    <li className="flex flex-wrap items-center justify-between gap-2 rounded-lg px-3 py-2 ring-1 ring-input">
      <span className="flex flex-col">
        <span className="font-medium">
          {invoice.code} · {formatMoney(invoice.total)}
        </span>
        <span className="text-xs text-muted-foreground">
          {invoice.customer_name} · {formatDateTime(invoice.issued_at, timeZone)} · {invoice.status_label}
        </span>
        {invoice.status === 'rejected' && invoice.provider_message !== '' ? (
          <span className="text-xs text-destructive">{invoice.provider_message}</span>
        ) : null}
      </span>
      <div className="flex flex-wrap items-center gap-2">
        <InvoiceArchiveStatus invoice={invoice} />
        <InvoiceDownloads invoice={invoice} />
        {invoice.status === 'accepted' ? null : (
          <Button type="button" size="sm" variant="outline" disabled={resending} onClick={onResend}>
            Reenviar
          </Button>
        )}
        <Button asChild size="sm" variant="ghost">
          <Link to={paths.billing.print(invoice.id)}>Imprimir</Link>
        </Button>
      </div>
    </li>
  )
}
