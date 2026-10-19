import { Link } from 'react-router'

import type { Invoice } from '@/api/types'
import { InvoiceDownloads } from '@/components/InvoiceDownloads'
import { Button } from '@/components/ui/button'
import { paths } from '@/services/paths'
import { InvoiceArchiveStatus } from './InvoiceArchiveStatus'

interface InvoiceRowActionsProps {
  readonly invoice: Invoice
  readonly resending: boolean
  readonly onResend: () => void
}

/** Respaldo, archivos, reenvío e impresión. Un anulado ya no se reenvía ni se imprime. */
export function InvoiceRowActions({ invoice, resending, onResend }: InvoiceRowActionsProps) {
  const isValid = !invoice.is_voided
  return (
    <div className="flex flex-wrap items-center gap-2">
      <InvoiceArchiveStatus invoice={invoice} />
      <InvoiceDownloads invoice={invoice} />
      {isValid && invoice.status !== 'accepted' ? (
        <Button type="button" size="sm" variant="outline" disabled={resending} onClick={onResend}>
          Reenviar
        </Button>
      ) : null}
      {isValid ? (
        <Button asChild size="sm" variant="ghost">
          <Link to={paths.billing.print(invoice.id)}>Imprimir</Link>
        </Button>
      ) : null}
    </div>
  )
}
