import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'

import { orderInvoiceQuery } from '@/api/billing'
import { PERMISSION } from '@/api/permissions'
import type { OrderResponse } from '@/api/types'
import { Icon } from '@/components/Icon'
import { Button } from '@/components/ui/button'
import { useCan } from '@/store/session'
import { InvoiceDialog } from '@/features/orders/invoice/InvoiceDialog'
import { IssuedInvoice } from '@/features/orders/invoice/IssuedInvoice'

interface InvoicePanelProps {
  readonly order: OrderResponse
}

/**
 * El comprobante electrónico de un pedido pagado: emitirlo o verlo.
 *
 * Aparece solo con el pedido pagado y para quien puede emitir. Ya emitido,
 * muestra el número, cómo lo recibió SUNAT, el PDF del proveedor y cómo enviarlo.
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

  return <IssuedInvoice invoice={issued} customerPhone={order.customer_phone} />
}
