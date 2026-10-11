import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Link } from 'react-router'

import { orderInvoiceQuery } from '@/api/billing'
import { PERMISSION } from '@/api/permissions'
import type { OrderResponse } from '@/api/types'
import { Icon } from '@/components/Icon'
import { Button } from '@/components/ui/button'
import { paths } from '@/services/paths'
import { useCan } from '@/store/session'
import { InvoiceDialog } from '@/features/orders/invoice/InvoiceDialog'

interface InvoicePanelProps {
  readonly order: OrderResponse
}

const TONE = {
  accepted: 'text-success',
  pending: 'text-warning',
  rejected: 'text-destructive',
  simulated: 'text-muted-foreground',
} as const

/** El PDF lo da el proveedor: solo se abre si es una dirección https. */
function isLinkSafe(url: string): boolean {
  try {
    return new URL(url).protocol === 'https:'
  } catch {
    return false
  }
}

/**
 * El comprobante electrónico de un pedido pagado: emitirlo o verlo.
 *
 * Aparece solo con el pedido pagado y para quien puede emitir. Ya emitido,
 * muestra el número, cómo lo recibió SUNAT y el PDF del proveedor.
 */
export function InvoicePanel({ order }: InvoicePanelProps) {
  const can = useCan(PERMISSION.billingIssue)
  const [isIssuing, setIsIssuing] = useState(false)
  const invoice = useQuery({ ...orderInvoiceQuery(order.id), enabled: can && order.status === 'paid' })
  if (!can || order.status !== 'paid' || invoice.isPending) {
    return null
  }
  const issued = invoice.data

  if (issued === null || issued === undefined) {
    return (
      <>
        <Button type="button" variant="outline" className="self-start" onClick={() => {
          setIsIssuing(true)
        }}>
          <Icon name="recipe" size={16} />
          <span>Emitir boleta o factura</span>
        </Button>
        <InvoiceDialog order={order} open={isIssuing} onClose={() => {
          setIsIssuing(false)
        }} />
      </>
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg px-4 py-3 text-sm ring-1 ring-input">
      <span className="font-semibold">{issued.kind_label} {issued.code}</span>
      <span className={TONE[issued.status]}>{issued.status_label}</span>
      {!isLinkSafe(issued.pdf_url) ? null : (
        <a href={issued.pdf_url} target="_blank" rel="noopener noreferrer" className="text-primary underline">
          PDF
        </a>
      )}
      <Button asChild variant="ghost" size="sm">
        <Link to={paths.billing.print(issued.id)}>
          <Icon name="print" size={14} />
          <span>Imprimir</span>
        </Link>
      </Button>
    </div>
  )
}
