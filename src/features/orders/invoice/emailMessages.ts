import type { ErrorCode } from '@/api/types'
import { errorCode } from '@/services/apiError'

const FALLBACK = 'No se pudo enviar el comprobante. Vuelve a intentarlo.'

/** El mensaje para un envío por correo que falló; el límite por hora lo trae el servidor en sus capacidades. */
export function emailErrorMessage(error: unknown, maxPerHour: number): string {
  const messages: Partial<Record<ErrorCode, string>> = {
    email_sending_disabled: 'El envío por correo no está activado en este restaurante.',
    email_delivery: 'No se pudo entregar el correo. Revisa la dirección o inténtalo en unos minutos.',
    email_rate_limited: `Se llegó al límite de ${String(maxPerHour)} correos por hora. Inténtalo más tarde.`,
    invalid_invoice: 'Este comprobante no se puede enviar por correo.',
    validation_error: 'Escribe un correo válido.',
  }
  const code = errorCode(error)
  return (code === undefined ? undefined : messages[code]) ?? FALLBACK
}
