import { useMutation, useQueryClient } from '@tanstack/react-query'

import { orderQueryKey, ordersQueryKey } from '../../api/orders'
import { tablesQueryKey } from '../../api/tables'
import type { OrderResponse } from '../../api/types'
import { errorMessage } from '../../services/api'
import { useNotifications } from '../../store/notifications'

interface OrderActionOptions<TVariables> {
  readonly mutationFn: (variables: TVariables) => Promise<OrderResponse>
  /** El aviso si sale bien. Sin el, el cambio se ve en la pantalla y basta. */
  readonly success?: (order: OrderResponse) => string
  readonly failure: string
  readonly onSuccess?: (order: OrderResponse) => void
}

/**
 * Una accion sobre un pedido: enviar, marcar listo, servir, cobrar, cancelar.
 *
 * Todas refrescan pedidos y mesas al terminar y muestran el `detail` del
 * servidor si falla: un 409 dice "la mesa ya tiene un pedido" o "el pedido
 * esta en cocina", que es justo lo que la persona necesita leer.
 */
export function useOrderAction<TVariables = void>({
  mutationFn,
  success,
  failure,
  onSuccess,
}: OrderActionOptions<TVariables>) {
  const queryClient = useQueryClient()
  const push = useNotifications((state) => state.push)

  return useMutation({
    mutationFn,
    onSuccess: async (order) => {
      queryClient.setQueryData(orderQueryKey(order.id), order)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ordersQueryKey }),
        queryClient.invalidateQueries({ queryKey: tablesQueryKey }),
      ])
      if (success !== undefined) {
        push({ tone: 'info', message: success(order) })
      }
      onSuccess?.(order)
    },
    onError: (error) => {
      push({ tone: 'warning', message: errorMessage(error, failure) })
    },
  })
}
