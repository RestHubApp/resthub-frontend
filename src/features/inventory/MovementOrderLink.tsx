import { Link } from 'react-router'

import { paths } from '@/services/paths'

interface MovementOrderLinkProps {
  /** El id del pedido que causó el movimiento. */
  readonly orderId: number
  /** El número del día que ve el personal; `null` si no se conoce. */
  readonly orderNumber: number | null
}

/** Enlace al pedido que causó un movimiento. El enlace usa el id; el texto, el número del día. */
export function MovementOrderLink({ orderId, orderNumber }: MovementOrderLinkProps) {
  return (
    <Link to={paths.orders.detail(orderId)} className="font-medium text-primary underline-offset-4 hover:underline">
      {orderNumber === null ? 'Ver pedido' : `Pedido #${String(orderNumber)}`}
    </Link>
  )
}
