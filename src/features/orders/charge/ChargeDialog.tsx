import { useState } from 'react'

import type { OrderResponse } from '../../../api/types'
import FormDialog from '../../../components/FormDialog'
import { orderPlace } from '../orderLabels'
import ChargeForm from './ChargeForm'
import ChargeReceipt from './ChargeReceipt'

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
  const [cobrado, setCobrado] = useState<OrderResponse | null>(null)
  const cerrar = () => {
    setCobrado(null)
    onClose()
  }

  if (order === null) {
    return null
  }

  return (
    <FormDialog
      open
      onOpenChange={(abierto) => {
        if (!abierto) {
          cerrar()
        }
      }}
      title={cobrado === null ? `Cobrar pedido #${String(order.number)}` : 'Cobro registrado'}
      description={
        cobrado === null ? `${orderPlace(order)} · ${order.waiter_name}` : undefined
      }
    >
      {cobrado === null ? (
        <ChargeForm order={order} onCharged={setCobrado} onCancel={cerrar} />
      ) : (
        <ChargeReceipt order={cobrado} onClose={cerrar} />
      )}
    </FormDialog>
  )
}
