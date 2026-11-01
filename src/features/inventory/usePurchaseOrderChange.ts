import { changePurchaseOrder, purchaseOrdersQuery } from '@/api/purchasing'
import { usePurchasingMutation } from './usePurchasingMutation'

/** Enviar o cancelar una orden de compra, avisando el resultado. */
export function usePurchaseOrderChange() {
  return usePurchasingMutation({
    mutationFn: (payload: { id: number; action: 'send' | 'cancel' }) => changePurchaseOrder(payload.id, payload.action),
    success: (order) => `Orden ${String(order.number)}: ${order.status_label.toLowerCase()}.`,
    failure: 'No se pudo cambiar la orden.',
    // Otro ya la recibió o la canceló: se avisa y se relee la lista.
    invalidateOnError: [purchaseOrdersQuery.queryKey],
  })
}
