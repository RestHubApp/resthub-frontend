import type { OrderResponse } from '@/api/types'
import { FormDialog } from '@/components/FormDialog'
import { CancelOrderForm } from './CancelOrderForm'
import { orderPlace } from './orderLabels'

interface CancelOrderDialogProps {
  /** El pedido a cancelar; `null` cierra la ventana. */
  readonly order: OrderResponse | null
  readonly onClose: () => void
}

/**
 * Cancelar un pedido, con su motivo.
 *
 * El motivo es obligatorio: un pedido cancelado sin explicacion es plata que
 * no entro y nadie sabe por que. Queda en el historial.
 */
export function CancelOrderDialog({ order, onClose }: CancelOrderDialogProps) {
  if (order === null) {
    return null
  }

  return (
    <FormDialog
      open
      onOpenChange={(open) => {
        if (!open) {
          onClose()
        }
      }}
      title={`¿Cancelar el pedido #${String(order.number)}?`}
      description={`${orderPlace(order)}. ${order.type === 'dine_in' ? 'La mesa queda libre y el' : 'El'} pedido pasa al historial como cancelado.`}
    >
      <CancelOrderForm order={order} onClose={onClose} />
    </FormDialog>
  )
}
