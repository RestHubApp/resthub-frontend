import { Link } from 'react-router'

import type { Invoice } from '@/api/types'
import { Icon } from '@/components/Icon'
import { Button } from '@/components/ui/button'
import { paths } from '@/services/paths'
import { InvoiceShare } from './InvoiceShare'

const TONE = {
  accepted: 'text-success',
  pending: 'text-warning',
  rejected: 'text-destructive',
  simulated: 'text-muted-foreground',
} as const

/** Un comprobante ya emitido: su número, cómo lo recibió SUNAT (con el motivo tal cual si lo rechazó), sus archivos y cómo enviarlo o imprimirlo. */
export function IssuedInvoice({ invoice }: { readonly invoice: Invoice }) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg px-4 py-3 text-sm ring-1 ring-input">
      <span className="font-semibold">{invoice.kind_label} {invoice.code}</span>
      <span className={TONE[invoice.status]}>{invoice.status_label}</span>
      {invoice.status === 'rejected' && invoice.provider_message !== '' ? (
        <p className="m-0 basis-full text-xs text-destructive">{invoice.provider_message}</p>
      ) : null}
      <InvoiceShare invoice={invoice} />
      <Button asChild variant="ghost" size="sm">
        <Link to={paths.billing.print(invoice.id)}>
          <Icon name="print" size={14} />
          <span>Imprimir</span>
        </Link>
      </Button>
    </div>
  )
}
