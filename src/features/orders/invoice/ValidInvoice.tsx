import { Link } from 'react-router'

import type { Invoice } from '@/api/types'
import { Icon } from '@/components/Icon'
import * as icons from '@/components/icons'
import { Button } from '@/components/ui/button'
import { paths } from '@/services/paths'
import { InvoiceShare } from './InvoiceShare'
import { InvoiceVoidActions } from './InvoiceVoidActions'
import { InvoiceVoidState } from './InvoiceVoidState'

const TONE = {
  accepted: 'text-success',
  pending: 'text-warning',
  rejected: 'text-destructive',
  simulated: 'text-muted-foreground',
} as const

/** Un comprobante vigente: su estado ante SUNAT, cómo enviarlo o imprimirlo, y cambiarlo o anularlo. */
export function ValidInvoice({ invoice }: { readonly invoice: Invoice }) {
  return (
    <>
      <span className={TONE[invoice.status]}>{invoice.status_label}</span>
      {invoice.status === 'rejected' && invoice.provider_message !== '' ? (
        <p className="m-0 basis-full text-xs text-destructive">{invoice.provider_message}</p>
      ) : null}
      <InvoiceVoidState invoice={invoice} />
      <InvoiceShare invoice={invoice} />
      <Button asChild variant="ghost" size="sm">
        <Link to={paths.billing.print(invoice.id)}>
          <Icon glyph={icons.print} size={14} />
          <span>Imprimir</span>
        </Link>
      </Button>
      <InvoiceVoidActions invoice={invoice} />
    </>
  )
}
