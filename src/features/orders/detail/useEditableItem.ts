import { useState } from 'react'

import { changeOrderItem, removeOrderItem } from '@/api/orders'
import type { ChangeItemRequest, OrderItemResponse } from '@/api/types'
import { useOrderAction } from '@/features/orders/useOrderAction'

/**
 * Los cambios de un plato del pedido: cantidad y nota, o quitarlo.
 *
 * Al guardar un cambio se cierra la edición de la nota.
 */
export function useEditableItem(orderId: number, item: OrderItemResponse) {
  const [isEditing, setIsEditing] = useState(false)
  const change = useOrderAction({
    mutationFn: (payload: ChangeItemRequest) => changeOrderItem(orderId, item.id, payload),
    failure: 'No se pudo cambiar el plato.',
    onSuccess: () => {
      setIsEditing(false)
    },
  })
  const remove = useOrderAction({
    mutationFn: () => removeOrderItem(orderId, item.id),
    success: () => `${item.name} quitado del pedido.`,
    failure: 'No se pudo quitar el plato.',
  })

  return { isEditing, setIsEditing, change, remove }
}
