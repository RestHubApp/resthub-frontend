// Los errores de la facturación electrónica que la persona tiene que entender
// sin leer el detalle técnico: el servicio de facturación caído, credenciales
// o certificado rechazados, un certificado que no sirve y un archivo del
// comprobante que todavía no existe, y los de anular un comprobante o reenviar
// su nota de crédito.
import type { ErrorCode } from '@/api/types'
import { errorCode, errorMessage } from './apiError'

const MESSAGES: Readonly<Partial<Record<ErrorCode, string>>> = {
  billing_provider: 'El servicio de facturación no está disponible, intenta en unos minutos.',
  invalid_billing_credentials: 'SUNAT no aceptó el usuario SOL, la clave o el certificado. Revísalos y vuelve a guardar.',
  invoice_document_unavailable: 'Ese archivo del comprobante todavía no está disponible. Si SUNAT aún no lo aceptó, reenvíalo e inténtalo después.',
  invoice_not_voidable: 'Todavía no se puede anular: si el comprobante está pendiente, reenvíalo; si su nota de crédito está en curso, reenvía la nota.',
  invoice_already_voided: 'Ese comprobante ya estaba anulado. La pantalla se actualizó.',
  invoice_not_found: 'Ese comprobante ya no existe.',
  credit_note_not_found: 'Esa nota de crédito ya no existe.',
  order_already_invoiced: 'El pedido ya tiene un comprobante vigente: el anterior tiene que quedar anulado antes de emitir otro.',
  missing_permission: 'No tienes permiso para hacer esto con los comprobantes.',
}

const INVALID_CERTIFICATE = 'El certificado no es válido o la contraseña no corresponde. Revisa el archivo y la contraseña.'

/**
 * El mensaje de un error de facturación según su código. El de un certificado
 * rechazado conserva el motivo del servidor (falta la llave privada, contraseña
 * equivocada); lo demás que no tiene mensaje propio muestra lo que dijo el
 * servidor o `fallback`.
 */
export function billingErrorMessage(error: unknown, fallback: string): string {
  const code = errorCode(error)
  const known = code === undefined ? undefined : MESSAGES[code]
  if (known !== undefined) return known
  return errorMessage(error, code === 'invalid_certificate' ? INVALID_CERTIFICATE : fallback)
}
