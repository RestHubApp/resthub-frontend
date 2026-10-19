import { useState } from 'react'

import type { OrderResponse } from '@/api/types'
import { Icon } from '@/components/Icon'
import { Button } from '@/components/ui/button'
import { InvoiceDialog } from './InvoiceDialog'

/** «Emitir boleta o factura» y su ventana. */
export function IssueInvoiceButton({ order }: { readonly order: OrderResponse }) {
  const [isIssuing, setIsIssuing] = useState(false)
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
