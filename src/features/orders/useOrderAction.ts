import { orderQueryKey, ordersQueryKey } from '@/api/orders'
import { tablesQueryKey } from '@/api/tables'
import type { OrderResponse } from '@/api/types'
import { useNotifiedMutation } from '@/store/useNotifiedMutation'

interface OrderActionOptions<TVariables> {
  readonly mutationFn: (variables: TVariables) => Promise<OrderResponse>
  /** El aviso si sale bien. Sin el, el cambio se ve en la pantalla y basta. */
  readonly success?: (order: OrderResponse) => string
  /** El aviso si falla, con el `detail` del servidor primero. Sin él, la ventana muestra el error. */
  readonly failure?: string | undefined
  readonly onSuccess?: (order: OrderResponse) => void
  /** Releer los pedidos también si falla: el rechazo puede venir de que el pedido cambió mientras tanto. */
  readonly shouldRereadOnError?: boolean
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
  shouldRereadOnError = false,
}: OrderActionOptions<TVariables>) {
  return useNotifiedMutation({
    mutationFn,
    failure,
    updateCache: (queryClient, order) => {
      queryClient.setQueryData(orderQueryKey(order.id), order)
    },
    invalidate: [ordersQueryKey, tablesQueryKey],
    invalidateOnError: shouldRereadOnError ? [ordersQueryKey] : [],
    // El aviso y lo que sigue esperan a que las listas estén al día.
    shouldWait: true,
    ...(success === undefined ? {} : { success }),
    ...(onSuccess === undefined ? {} : { onSuccess }),
  })
}
