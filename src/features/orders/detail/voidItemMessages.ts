import type { ErrorCode } from '@/api/types'
import { errorCode } from '@/services/apiError'
import { MAX_VOID_REASON } from '@/features/orders/voidItemSchema'

/** Los motivos que más se repiten: un toque y listo. */
export const QUICK_VOID_REASONS = ['Error del mesero', 'Cliente cambió de opinión', 'Sin insumo'] as const

const FALLBACK = 'No se pudo anular el plato. Vuelve a intentarlo.'

const MESSAGES: Partial<Record<ErrorCode, string>> = {
  order_has_payments: 'El pedido ya tiene pagos: ya no se puede anular un plato.',
  item_already_voided: 'Ese plato ya estaba anulado. El pedido se actualizó.',
  // En «abierto» el plato se quita; cerrado, ya no cambia.
  invalid_transition: 'El pedido ya no permite anular platos.',
  conflict: 'El pedido cambió mientras tanto. Revisa los platos y vuelve a intentarlo.',
  order_item_not_found: 'Ese plato ya no está en el pedido.',
  order_not_found: 'El pedido ya no existe.',
  missing_permission: 'No tienes permiso para anular platos.',
  validation_error: `Escribe un motivo de hasta ${String(MAX_VOID_REASON)} caracteres.`,
  invalid_order: `Escribe un motivo de hasta ${String(MAX_VOID_REASON)} caracteres.`,
}

/** El mensaje para una anulación que falló, según el código del error y no su texto. */
export function voidErrorMessage(error: unknown): string {
  const code = errorCode(error)
  return (code === undefined ? undefined : MESSAGES[code]) ?? FALLBACK
}
