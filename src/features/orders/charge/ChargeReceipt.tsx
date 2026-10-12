import type { OrderResponse } from '@/api/types'
import { Button } from '@/components/ui/button'
import { InvoicePanel } from '@/features/orders/InvoicePanel'
import { PaymentsDone } from './PaymentsDone'
import { ReceiptBanner } from './ReceiptBanner'
import { ReceiptTotals } from './ReceiptTotals'

interface ChargeReceiptProps {
  readonly order: OrderResponse
  readonly onClose: () => void
}

/**
 * El resultado del cobro, con el vuelto que calculó el servidor.
 *
 * El vuelto es el del último pago, el que se acaba de cobrar: es el número
 * que importa en la caja, así que va grande y se anuncia.
 */
export function ChargeReceipt({ order, onClose }: ChargeReceiptProps) {
  const last = order.payments.at(-1)
  const change = last?.change ?? null
  const received = last?.amount_received ?? ''

  return (
    <div className="flex flex-col gap-4">
      <ReceiptBanner order={order} change={change} />
      <ReceiptTotals order={order} received={received} />
      {order.payments.length > 1 ? <PaymentsDone order={order} /> : null}
      <InvoicePanel order={order} />
      <Button type="button" onClick={onClose}>
        Terminar
      </Button>
    </div>
  )
}
