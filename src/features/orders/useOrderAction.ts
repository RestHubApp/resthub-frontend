import type { QueryKey } from '@tanstack/react-query'

import { orderQueryKey, ordersQueryKey } from '@/api/orders'
import { tablesQueryKey } from '@/api/tables'
import type { OrderResponse } from '@/api/types'
import { errorStatus } from '@/services/apiError'
import { useNotifiedMutation } from '@/store/useNotifiedMutation'

interface OrderActionOptions<TVariables> {
  readonly mutationFn: (variables: TVariables) => Promise<OrderResponse>
  /** El aviso si sale bien. Sin el, el cambio se ve en la pantalla y basta. */
  readonly success?: (order: OrderResponse) => string
  /** El aviso si falla, con el `detail` del servidor primero. Sin él, la ventana muestra el error. */
  readonly failure?: string | undefined
  readonly onSuccess?: (order: OrderResponse) => void
  /** Releer los pedidos con cualquier fallo, no solo con un conflicto (409). */
  readonly shouldRereadOnError?: boolean
  /** Lo que además se relee si falla, según el error (la caja, si la cerraron). */
  readonly rereadOnError?: (error: unknown) => readonly QueryKey[]
}

// El servidor rechazó el cambio porque el pedido cambió mientras tanto.
const CONFLICT = 409

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
  rereadOnError,
}: OrderActionOptions<TVariables>) {
  // Con un 409 se relee: reintentar con el dato viejo volvería a fallar. Un
  // corte de red no relee: sin señal la consulta tampoco llegaría.
  const rereadKeys = (error: unknown): readonly QueryKey[] => [
    ...(shouldRereadOnError || errorStatus(error) === CONFLICT ? [ordersQueryKey, tablesQueryKey] : []),
    ...(rereadOnError?.(error) ?? []),
  ]
  return useNotifiedMutation({
    mutationFn,
    failure,
    updateCache: (queryClient, order) => {
      queryClient.setQueryData(orderQueryKey(order.id), order)
    },
    invalidate: [ordersQueryKey, tablesQueryKey],
    invalidateOnError: rereadKeys,
    // El aviso y lo que sigue esperan a que las listas estén al día.
    shouldWait: true,
    ...(success === undefined ? {} : { success }),
    ...(onSuccess === undefined ? {} : { onSuccess }),
  })
}
