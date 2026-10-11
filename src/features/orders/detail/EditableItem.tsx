import { Suspense, useState } from 'react'
import { lazyNamed } from '@/components/lazyNamed'

import { changeOrderItem, removeOrderItem } from '@/api/orders'
import type { ChangeItemRequest, OrderItemResponse } from '@/api/types'
import { Icon } from '@/components/Icon'
import type { OrderNoteFlag } from '@/hooks/useOrderNoteFlags'
import { Button } from '@/components/ui/button'
import { ItemNote } from '@/features/orders/ItemNote'
import { QuantityStepper } from '@/features/orders/QuantityStepper'
import { MAX_QUANTITY } from '@/features/orders/taking/useOrderDraft'
import { useOrderAction } from '@/features/orders/useOrderAction'
import { formatMoney } from '@/services/format'

// El diálogo trae react-hook-form y zod: se baja la primera vez que se edita una nota.
const ItemNoteDialog = lazyNamed(() => import('./ItemNoteDialog'), 'ItemNoteDialog')

interface EditableItemProps {
  readonly orderId: number
  readonly item: OrderItemResponse
  readonly flag?: OrderNoteFlag
}

/**
 * Un plato de un pedido abierto: se cambia la cantidad, la nota o se quita.
 *
 * Solo mientras el pedido no llego a cocina; despues, cambiar un plato es algo
 * que se habla con la cocina y el servidor lo rechaza.
 */
export function EditableItem({ orderId, item, flag }: EditableItemProps) {
  const [editing, setEditing] = useState(false)
  const change = useOrderAction({
    mutationFn: (payload: ChangeItemRequest) => changeOrderItem(orderId, item.id, payload),
    failure: 'No se pudo cambiar el plato.',
    onSuccess: () => {
      setEditing(false)
    },
  })
  const remove = useOrderAction({
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
          disabled={change.isPending || remove.isPending}
          onChange={(quantity) => {
            if (quantity <= 0) {
              remove.mutate()
              return
            }
            change.mutate({ quantity: quantity })
          }}
        />
      </div>
      <ItemNote note={item.notes} flag={flag} />
      <Button type="button" variant="ghost" className="h-11 w-fit px-3" onClick={() => {
        setEditing(true)
      }}>
        <Icon name="nota" size={16} />
        <span>{item.notes === '' ? 'Agregar nota' : 'Cambiar nota'}</span>
      </Button>
      {editing ? (
        <Suspense fallback={null}>
          <ItemNoteDialog
            open={editing}
            onOpenChange={setEditing}
            dish={item.name}
            notes={item.notes}
            pending={change.isPending}
            onSave={(notes) => {
              change.mutate({ notes })
            }}
          />
        </Suspense>
      ) : null}
    </li>
  )
}
