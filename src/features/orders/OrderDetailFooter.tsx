import type { OrderResponse } from '@/api/types'
import type { OrderNoteFlags } from '@/hooks/useOrderNoteFlags'
import { OrderItems } from './detail/OrderItems'
import { PrintLinks } from './detail/PrintLinks'
import { OrderClosedInfo } from './OrderClosedInfo'

interface OrderDetailFooterProps {
  readonly order: OrderResponse
  readonly flagFor: OrderNoteFlags['flagFor']
}

/** El pie del detalle: enlaces de impresion, cierre del pedido y sus platos. */
export function OrderDetailFooter({ order, flagFor }: OrderDetailFooterProps) {
  return (
    <>
      <PrintLinks order={order} />
      <OrderClosedInfo order={order} />
      <OrderItems order={order} flagFor={flagFor} />
    </>
  )
}
