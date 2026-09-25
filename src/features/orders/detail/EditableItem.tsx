import { useState } from 'react'

import { changeOrderItem, removeOrderItem } from '../../../api/orders'
import type { ChangeItemRequest, OrderItemResponse } from '../../../api/types'
import Icon from '../../../components/Icon'
import { Button } from '../../../components/ui/button'
import ItemNote from '../ItemNote'
import QuantityStepper from '../QuantityStepper'
import { MAX_QUANTITY } from '../taking/useOrderDraft'
import { useOrderAction } from '../useOrderAction'
import ItemNoteDialog from './ItemNoteDialog'
import { formatMoney } from '../../../services/format'

interface EditableItemProps {
  readonly orderId: number
  readonly item: OrderItemResponse
}

/**
 * Un plato de un pedido abierto: se cambia la cantidad, la nota o se quita.
 *
 * Solo mientras el pedido no llego a cocina; despues, cambiar un plato es algo
 * que se habla con la cocina y el servidor lo rechaza.
 */
export default function EditableItem({ orderId, item }: EditableItemProps) {
  const [editando, setEditando] = useState(false)
  const cambio = useOrderAction({
    mutationFn: (payload: ChangeItemRequest) => changeOrderItem(orderId, item.id, payload),
    failure: 'No se pudo cambiar el plato.',
    onSuccess: () => {
      setEditando(false)
    },
  })
  const quitar = useOrderAction({
    mutationFn: () => removeOrderItem(orderId, item.id),
    success: () => `${item.name} quitado del pedido.`,
    failure: 'No se pudo quitar el plato.',
  })

  return (
    <li className="flex flex-col gap-2 border-b pb-3 last:border-b-0">
      <div className="flex items-center gap-3">
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="font-medium">{item.name}</span>
          <span className="text-sm text-muted-foreground tabular-nums">{formatMoney(item.subtotal)}</span>
        </div>
        <QuantityStepper
          name={item.name}
          quantity={item.quantity}
          max={MAX_QUANTITY}
          disabled={cambio.isPending || quitar.isPending}
          onChange={(cantidad) => {
            if (cantidad <= 0) {
              quitar.mutate()
              return
            }
            cambio.mutate({ quantity: cantidad })
          }}
        />
      </div>
      <ItemNote note={item.notes} />
      <Button type="button" variant="ghost" className="h-11 w-fit px-3" onClick={() => {
        setEditando(true)
      }}>
        <Icon name="nota" size={16} />
        <span>{item.notes === '' ? 'Agregar nota' : 'Cambiar nota'}</span>
      </Button>
      <ItemNoteDialog
        open={editando}
        onOpenChange={setEditando}
        dish={item.name}
        notes={item.notes}
        pending={cambio.isPending}
        onSave={(notes) => {
          cambio.mutate({ notes })
        }}
      />
    </li>
  )
}
