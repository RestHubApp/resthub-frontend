import type { QueryKey } from '@tanstack/react-query'

import { inventoryQueryKey } from '@/api/inventory'
import { useNotifiedMutation } from '@/store/useNotifiedMutation'

interface PurchasingMutationOptions<TVariables, TResult> {
  readonly mutationFn: (variables: TVariables) => Promise<TResult>
  readonly success: (result: TResult) => string
  readonly failure: string
  readonly onSuccess?: (result: TResult) => void
  /** Lo que se relee si el servidor lo rechaza (p. ej. otro ya cambió la orden). */
  readonly invalidateOnError?: readonly QueryKey[]
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
  invalidateOnError = [],
}: PurchasingMutationOptions<TVariables, TResult>) {
  return useNotifiedMutation({
    mutationFn,
    success,
    failure,
    invalidate: [inventoryQueryKey],
    invalidateOnError,
    ...(onSuccess === undefined ? {} : { onSuccess }),
  })
}
