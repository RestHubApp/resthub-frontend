import { useState } from 'react'

import type { OrderItemResponse, OrderResponse } from '@/api/types'
import { FormDialog } from '@/components/FormDialog'
import { FormFooter } from '@/components/FormFooter'
import { liveItems } from '@/features/orders/kitchenRounds'
import { VoidItemForm } from './VoidItemForm'

interface VoidItemDialogProps {
  readonly order: OrderResponse
  readonly item: OrderItemResponse
  readonly onClose: () => void
  /** Abre la cancelación del pedido, cuando ya no le queda ningún plato. */
  readonly onCancelOrder: () => void
}

/**
 * Anular un plato que ya está en cocina, con su motivo.
 *
 * Si con esto el pedido se queda sin platos, la misma ventana sugiere
 * cancelarlo en vez de abrir otra encima.
 */
export function VoidItemDialog({ order, item, onClose, onCancelOrder }: VoidItemDialogProps) {
  const [isEmptied, setIsEmptied] = useState(false)

  return (
    <FormDialog
      open
      onOpenChange={(open) => {
        if (!open) {
          onClose()
        }
      }}
      title={isEmptied ? 'Ya no queda ningún plato' : `¿Anular ${String(item.quantity)} × ${item.name}?`}
      description={
        isEmptied
          ? `El pedido #${String(order.number)} no tiene platos vigentes. Si no van a pedir otra cosa, cancélalo.`
          : 'Ya está en cocina: queda tachado en el pedido, con su motivo, y no se cobra.'
      }
    >
      {isEmptied ? (
        <FormFooter
          mutation={{ isPending: false }}
          onCancel={onClose}
          cancelLabel="Ahora no"
          submit={{
            label: 'Cancelar pedido',
            variant: 'destructive',
            onClick: () => {
              onClose()
              onCancelOrder()
            },
          }}
        />
      ) : (
        <VoidItemForm
          order={order}
          item={item}
          onClose={onClose}
          onVoided={(updated) => {
            if (liveItems(updated).length === 0) {
              setIsEmptied(true)
              return
            }
            onClose()
          }}
        />
      )}
    </FormDialog>
  )
}
