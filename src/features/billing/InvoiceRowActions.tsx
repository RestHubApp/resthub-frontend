import { Link } from 'react-router'

import { PERMISSION } from '@/api/permissions'
import type { Invoice } from '@/api/types'
import { InvoiceDownloads } from '@/components/InvoiceDownloads'
import { Button } from '@/components/ui/button'
import { paths } from '@/services/paths'
import { useCan } from '@/store/session'
import { InvoiceArchiveStatus } from './InvoiceArchiveStatus'

interface InvoiceRowActionsProps {
  readonly invoice: Invoice
  readonly resending: boolean
  readonly onResend: () => void
}

/**
 * Respaldo, archivos, reenvío e impresión. Un anulado ya no se reenvía ni se imprime.
 *
 * Los archivos y la hoja de impresión los sirve el servidor solo a quien emite
 * comprobantes (billing.issue); a quien solo los revisa (billing.manage) no se
 * le ofrecen, porque recibiría un 403.
 */
export function InvoiceRowActions({ invoice, resending, onResend }: InvoiceRowActionsProps) {
  const isValid = !invoice.is_voided
  const canIssue = useCan(PERMISSION.billingIssue)
  return (
    <div className="flex flex-wrap items-center gap-2">
      <InvoiceArchiveStatus invoice={invoice} />
      {canIssue ? <InvoiceDownloads invoice={invoice} /> : null}
      {isValid && invoice.status !== 'accepted' ? (
        <Button type="button" size="sm" variant="outline" disabled={resending} onClick={onResend}>
          Reenviar
        </Button>
      ) : null}
      {isValid && canIssue ? (
        <Button asChild size="sm" variant="ghost">
          <Link to={paths.billing.print(invoice.id)}>Imprimir</Link>
        </Button>
      ) : null}
    </div>
  )
}
