import type { OrderItemResponse } from '@/api/types'
import type { OrderNoteFlag } from '@/hooks/useOrderNoteFlags'
import { ItemNote } from '@/features/orders/ItemNote'
import { QuantityStepper } from '@/features/orders/QuantityStepper'
import { MAX_QUANTITY } from '@/features/orders/quantityLimit'
import { formatMoney } from '@/services/format'
import { ItemNoteEditor } from './ItemNoteEditor'
import { useEditableItem } from './useEditableItem'

interface EditableItemProps {
  readonly orderId: number
  readonly item: OrderItemResponse
  readonly flag?: OrderNoteFlag | undefined
}

/**
 * Un plato de un pedido abierto: se cambia la cantidad, la nota o se quita.
 *
 * Solo mientras el pedido no llego a cocina; despues, cambiar un plato es algo
 * que se habla con la cocina y el servidor lo rechaza.
 */
export function EditableItem({ orderId, item, flag }: EditableItemProps) {
  const { isEditing, setIsEditing, change, remove } = useEditableItem(orderId, item)

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
            change.mutate({ quantity })
          }}
        />
      </div>
      <ItemNote note={item.notes} flag={flag} />
      <ItemNoteEditor
        item={item}
        isEditing={isEditing}
        isPending={change.isPending}
        onEditingChange={setIsEditing}
        onSave={(notes) => {
          change.mutate({ notes })
        }}
      />
    </li>
  )
}
