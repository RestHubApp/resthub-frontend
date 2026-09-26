import type { OrderResponse } from '../../../api/types'
import ChargeContent from './ChargeContent'

interface ChargeDialogProps {
  /** El pedido a cobrar; `null` cierra la ventana. */
  readonly order: OrderResponse | null
  readonly onClose: () => void
}

/**
 * La ventana de cobro.
 *
 * La controla quien la abre, no la tarjeta del pedido: al cobrar, el pedido
 * sale del tablero y su tarjeta desaparece, pero el vuelto tiene que seguir a
 * la vista hasta que quien cobra cierre la ventana.
 */
export default function ChargeDialog({ order, onClose }: ChargeDialogProps) {
  if (order === null) {
    return null
  }
  return <ChargeContent key={order.id} order={order} onClose={onClose} />
}
