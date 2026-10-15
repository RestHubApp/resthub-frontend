import type { OrderResponse } from '@/api/types'
import type { OrderNoteFlags } from '@/hooks/useOrderNoteFlags'
import { OrderItems } from './detail/OrderItems'
import { OrderClosedInfo } from './OrderClosedInfo'

interface OrderDetailFooterProps {
  readonly order: OrderResponse
  readonly flagFor: OrderNoteFlags['flagFor']
  /** Abre la cancelación del pedido. */
  readonly onCancel: () => void
}

/** El pie del detalle: cierre del pedido y sus platos. */
export function OrderDetailFooter({ order, flagFor, onCancel }: OrderDetailFooterProps) {
  return (
    <>
      <OrderClosedInfo order={order} />
      <OrderItems order={order} flagFor={flagFor} onCancelOrder={onCancel} />
    </>
  )
}
