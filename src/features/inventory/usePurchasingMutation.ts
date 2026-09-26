import { useMutation, useQueryClient } from '@tanstack/react-query'

import { inventoryQueryKey } from '../../api/inventory'
import { errorMessage } from '../../services/api'
import { useNotifications } from '../../store/notifications'

interface PurchasingMutationOptions<TVariables, TResult> {
  readonly mutationFn: (variables: TVariables) => Promise<TResult>
  readonly success: (result: TResult) => string
  readonly failure: string
  readonly onSuccess?: (result: TResult) => void
}

/**
 * Un cambio en compras: proveedores u órdenes.
 *
 * Relee el inventario entero de fondo: recibir una orden cambia el stock, las
 * alertas y las sugerencias a la vez.
 */
export function usePurchasingMutation<TVariables, TResult>({
  mutationFn,
  success,
  failure,
  onSuccess,
}: PurchasingMutationOptions<TVariables, TResult>) {
  const queryClient = useQueryClient()
  const push = useNotifications((state) => state.push)

  return useMutation({
    mutationFn,
    onSuccess: (result) => {
      void queryClient.invalidateQueries({ queryKey: inventoryQueryKey })
      push({ tone: 'info', message: success(result) })
      onSuccess?.(result)
    },
    onError: (error) => {
      push({ tone: 'warning', message: errorMessage(error, failure) })
    },
  })
}
