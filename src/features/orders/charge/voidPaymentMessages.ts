import type { ErrorCode, OrderResponse, PaymentResponse } from '@/api/types'
import { errorCode } from '@/services/apiError'
import { formatMoney } from '@/services/format'
import { MAX_VOID_REASON } from '@/features/orders/voidItemSchema'

/** Lo que más se equivoca al cobrar: un toque y listo. */
export const QUICK_PAYMENT_VOID_REASONS = ['Medio de pago equivocado', 'Monto equivocado', 'Cobro duplicado'] as const

const FALLBACK = 'No se pudo anular el cobro. Vuelve a intentarlo.'

const MESSAGES: Partial<Record<ErrorCode, string>> = {
  payment_not_voidable: 'Ese cobro es de un turno de caja que ya se cerró: su arqueo no se cambia.',
  order_already_invoiced: 'El pedido tiene un comprobante emitido: anúlalo antes de anular el cobro.',
  payment_not_found: 'Ese cobro ya estaba anulado. El pedido se actualizó.',
  invalid_transition: 'El pedido ya no permite anular cobros.',
  missing_permission: 'Solo quien maneja la caja puede anular un cobro.',
  validation_error: `Escribe un motivo de hasta ${String(MAX_VOID_REASON)} caracteres.`,
  invalid_order: `Escribe un motivo de hasta ${String(MAX_VOID_REASON)} caracteres.`,
}

/** El mensaje para una anulación de cobro que falló, según el código del error. */
export function voidPaymentErrorMessage(error: unknown): string {
  const code = errorCode(error)
  return (code === undefined ? undefined : MESSAGES[code]) ?? FALLBACK
}

/** El aviso de un cobro anulado: cuánto salió y cuánto falta cobrar ahora. */
export function voidedPaymentMessage(payment: PaymentResponse, order: OrderResponse): string {
  return `Cobro de ${formatMoney(payment.amount)} anulado: faltan ${formatMoney(order.balance)}.`
}
